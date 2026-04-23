import User from '../models/user.model.js';

// Map lưu trạng thái online: userId -> { socketId, userInfo }
const onlineUsers = new Map();
// Map lưu conversation: roomId -> [messages]
const conversations = new Map();

export default function initChatSocket(io) {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        // User/Admin đăng nhập - đăng ký socket
        socket.on('user:register', async (userInfo) => {
            // userInfo: { userId, name, email, role, avatar }
            let fullUserInfo = { ...userInfo };

            // Nếu là user thường → fetsh đầy đủ thông tin từ DB
            if (userInfo.role === 'user' && userInfo.userId) {
                try {
                    const dbUser = await User.findById(userInfo.userId).lean();
                    if (dbUser) {
                        fullUserInfo = {
                            userId: userInfo.userId,
                            name: dbUser.name,
                            email: dbUser.email,
                            role: 'user',
                            avatar: dbUser.avatar || '',
                            phone_number: dbUser.phone_number || '',
                            address: dbUser.address || '',
                            dob: dbUser.dob || null,
                            gender: dbUser.gender || '',
                            create_at: dbUser.create_at || null,
                        };
                    }
                } catch (err) {
                    console.error('Socket: Error fetching user from DB:', err.message);
                }
            }

            onlineUsers.set(fullUserInfo.userId, {
                socketId: socket.id,
                userInfo: fullUserInfo,
                connectedAt: new Date()
            });
            socket.userId = fullUserInfo.userId;
            socket.role = fullUserInfo.role;

            console.log(`${fullUserInfo.role} [${fullUserInfo.name}] connected`);

            // Gửi danh sách online users cho admin
            broadcastOnlineUsers(io);

            // Nếu là admin, gửi danh sách online users ngay
            if (fullUserInfo.role === 'admin') {
                socket.emit('online:users', getOnlineUsersList());
            }
        });

        // Gửi tin nhắn giữa user và admin
        socket.on('message:send', (data) => {
            const { fromId, fromName, fromRole, toId, toRole, message, avatar } = data;

            const roomId = getRoomId(fromId, toId);
            if (!conversations.has(roomId)) {
                conversations.set(roomId, []);
            }

            const msgObj = {
                id: Date.now(),
                fromId,
                fromName,
                fromRole,
                message,
                avatar,
                timestamp: new Date()
            };

            conversations.get(roomId).push(msgObj);
            // Giới hạn 200 tin nhắn mỗi cuộc chat
            if (conversations.get(roomId).length > 200) {
                conversations.get(roomId).shift();
            }

            // Gửi cho người nhận
            const recipient = onlineUsers.get(toId);
            if (recipient) {
                io.to(recipient.socketId).emit('message:receive', { roomId, msg: msgObj });
            }

            // Gửi lại cho người gửi (confirm)
            socket.emit('message:sent', { roomId, msg: msgObj });

            // Nếu user gửi cho admin → notify toàn bộ admin đang online
            if (fromRole === 'user') {
                notifyAdmins(io, { fromId, fromName, avatar, message });
            }
        });

        // Lấy lịch sử chat của một phòng
        socket.on('chat:history', ({ userId, adminId }) => {
            const roomId = getRoomId(userId, adminId);
            const history = conversations.get(roomId) || [];
            socket.emit('chat:history', { roomId, messages: history });
        });

        // Admin request danh sách online users
        socket.on('admin:getOnlineUsers', () => {
            socket.emit('online:users', getOnlineUsersList());
        });

        // Admin mở chat với user cụ thể
        socket.on('admin:openChat', ({ adminId, userId }) => {
            const roomId = getRoomId(userId, adminId);
            const history = conversations.get(roomId) || [];
            socket.emit('chat:history', { roomId, messages: history });
        });

        socket.on('disconnect', () => {
            if (socket.userId) {
                onlineUsers.delete(socket.userId);
                console.log(`User [${socket.userId}] disconnected`);
                broadcastOnlineUsers(io);
            }
        });
    });
}

function getRoomId(id1, id2) {
    return [id1, id2].sort().join('_');
}

function getOnlineUsersList() {
    const list = [];
    for (const [userId, data] of onlineUsers.entries()) {
        if (data.userInfo.role === 'user') {
            list.push({ userId, ...data.userInfo, connectedAt: data.connectedAt });
        }
    }
    return list;
}

function broadcastOnlineUsers(io) {
    const list = getOnlineUsersList();
    for (const [userId, data] of onlineUsers.entries()) {
        if (data.userInfo.role === 'admin') {
            io.to(data.socketId).emit('online:users', list);
        }
    }
}

function notifyAdmins(io, notif) {
    for (const [userId, data] of onlineUsers.entries()) {
        if (data.userInfo.role === 'admin') {
            io.to(data.socketId).emit('admin:newMessage', notif);
        }
    }
}
