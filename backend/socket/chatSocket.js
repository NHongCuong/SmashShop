import User from '../models/user.model.js';
import Message from '../models/message.model.js';

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
            // Cập nhật tới toàn bộ admin
            io.emit('online:users', getOnlineUsersList());
        });

        // Gửi tin nhắn giữa user và admin
        socket.on('message:send', (data) => {
            const { fromId, fromName, fromRole, toId, toRole, message, replyTo, avatar } = data;

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
                replyTo: replyTo || null,
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

            // Ghi nội dung vào bảng Message
            (async () => {
                try {
                    const chatUserId = fromRole === 'user' ? fromId : toId;
                    const contactInfo = fromRole === 'user' ? onlineUsers.get(fromId)?.userInfo : onlineUsers.get(toId)?.userInfo;

                    const roleLabel = fromRole === 'admin' ? 'admin' : 'user';
                    const replyText = replyTo ? ` [Trả lời ${replyTo.name}: ${replyTo.message}]` : '';
                    const chatLine = `${fromName}(${roleLabel})${replyText}: ${message}`;

                    let dbMsg = await Message.findOne({ user_id: chatUserId });
                    if (dbMsg) {
                        dbMsg.content_message += `; ${chatLine}`;
                        await dbMsg.save();
                    } else if (contactInfo) {
                        await Message.create({
                            user_id: chatUserId,
                            name: contactInfo.name,
                            email: contactInfo.email,
                            phone_number: contactInfo.phone_number || '',
                            content_message: chatLine
                        });
                    }
                } catch (err) {
                    console.error("Lỗi lưu message model:", err);
                }
            })();

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

        // Xử lý sự kiện "Đang soạn tin nhắn..."
        socket.on('chat:typing', (data) => {
            const { fromId, toId, isTyping, role } = data;
            const recipient = onlineUsers.get(toId);
            if (recipient) {
                // Gửi tới đúng client nhận
                io.to(recipient.socketId).emit('chat:typing', { fromId, isTyping, role });
            }
            if (role === 'user') {
                // Nếu User đang gõ, báo cho các admin socket biết
                io.emit('chat:typing', { fromId, isTyping, role });
            }
        });

        // Xử lý reaction event
        socket.on('chat:reaction', (data) => {
            const { roomId, msgId, reaction, fromId, toId } = data;
            if (conversations.has(roomId)) {
                const msgs = conversations.get(roomId);
                const msg = msgs.find(m => m.id === msgId);
                if (msg) {
                    if (!msg.reactions) msg.reactions = {};
                    msg.reactions[fromId] = reaction;
                }
            }
            // Broadcast cho tất cả ai đang quan tâm
            io.emit('chat:reaction:update', { roomId, msgId, reaction, fromId });
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
    io.emit('online:users', list);
}

function notifyAdmins(io, notif) {
    // Phát sự kiện tới tất cả client. Chỉ có AdminDashboard mới lắng nghe 'admin:newMessage'.
    // Cách này giúp giải quyết dứt điểm lỗi admin có nhiều tab hoặc disconnect/reconnect làm mất socketId.
    io.emit('admin:newMessage', notif);
}
