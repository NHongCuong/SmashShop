import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import jwt from 'jsonwebtoken';
import sendmail from "../utils/sendmail.js";

// Map lưu trạng thái online: userId -> { socketId, userInfo }
const onlineUsers = new Map();
// Map lưu conversation: roomId -> [messages]
const conversations = new Map();

export default function initChatSocket(io) {
    // Socket.io authentication middleware — verify JWT token khi connect
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Unauthorized: No token provided"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // { _id, email, role }
            next();
        } catch (err) {
            return next(new Error("Unauthorized: Token invalid"));
        }
    });

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        // User/Admin đăng nhập - đăng ký socket
        socket.on('user:register', async (userInfo) => {
            // Xác thực role từ JWT token
            const verifiedRole = socket.user.role;

            // Admin: cho phép dùng userId tùy chỉnh (ADMIN_SUPPORT) vì chat system phụ thuộc vào ID cố định này
            // User: luôn dùng userId từ JWT token đã xác thực để chống giả mạo
            const verifiedUserId = verifiedRole === 'admin'
                ? (userInfo.userId || socket.user._id)  // Admin giữ ADMIN_SUPPORT ID
                : socket.user._id;                       // User luôn dùng JWT _id

            let fullUserInfo = {
                ...userInfo,
                userId: verifiedUserId,
                role: verifiedRole
            };

            // Nếu là user thường → fetch đầy đủ thông tin từ DB
            if (verifiedRole === 'user' && verifiedUserId) {
                try {
                    const dbUser = await User.findById(verifiedUserId).lean();
                    if (dbUser) {
                        fullUserInfo = {
                            userId: verifiedUserId,
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
                id: data.id || Date.now(),
                fromId,
                fromName,
                fromRole,
                email: fromRole === 'admin' ? (socket.user?.email || "") : (onlineUsers.get(fromId)?.userInfo?.email || ""),
                phone_number: fromRole === 'admin' ? "" : (onlineUsers.get(fromId)?.userInfo?.phone_number || ""),
                message,
                replyTo: replyTo || null,
                avatar,
                timestamp: new Date(),
                isRecalled: false
            };

            if (fromRole === 'admin') {
                const customerId = toId;
                msgObj.email_customer = onlineUsers.get(customerId)?.userInfo?.email || "";
                msgObj.phone_customer = onlineUsers.get(customerId)?.userInfo?.phone_number || "";
            }

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
                    let email = "";
                    let phone_number = "";
                    let email_customer = "";
                    let phone_customer = "";

                    const customerId = fromRole === 'user' ? fromId : toId;
                    const customerInfo = onlineUsers.get(customerId)?.userInfo;
                    if (customerInfo) {
                        email_customer = customerInfo.email || "";
                        phone_customer = customerInfo.phone_number || "";
                    } else {
                        const dbUser = await User.findById(customerId).lean();
                        if (dbUser) {
                            email_customer = dbUser.email || "";
                            phone_customer = dbUser.phone_number || "";
                        }
                    }

                    if (fromRole === 'admin') {
                        email = socket.user?.email || "";
                        // Dùng ID thật của Admin (socket.user._id) thay vì ADMIN_SUPPORT để lấy SĐT
                        const adminInfo = await User.findById(socket.user._id).lean();
                        if (adminInfo) {
                            phone_number = adminInfo.phone_number || "";
                        }
                    } else {
                        email = email_customer;
                        phone_number = phone_customer;
                    }

                    const messageData = {
                        roomId,
                        msgId: msgObj.id,
                        fromId,
                        fromName,
                        fromRole,
                        email,
                        phone_number,
                        message,
                        replyTo,
                        avatar,
                        create_at: msgObj.timestamp
                    };

                    if (fromRole === 'admin') {
                        messageData.email_customer = email_customer;
                        messageData.phone_customer = phone_customer;
                    }

                    await Message.create(messageData);
                } catch (err) {
                    console.error("Lỗi lưu message model:", err);
                }
            })();

            // Nếu user gửi cho admin → notify toàn bộ admin đang online
            if (fromRole === 'user') {
                notifyAdmins(io, { fromId, fromName, avatar, message });

                // Kiểm tra xem có admin nào đang online không
                const isAnyAdminOnline = Array.from(onlineUsers.values()).some(u => u.userInfo.role === 'admin');

                if (!isAnyAdminOnline) {
                    // Gửi email thông báo cho Admin nếu offline
                    const adminEmail = process.env.EMAIL; // Gửi tới email hệ thống hoặc email admin cụ thể
                    const subject = `[SmashShop] Tin nhắn mới từ khách hàng ${fromName}`;
                    const html = `
                        <h2>Bạn có tin nhắn mới từ khách hàng ${fromName}</h2>
                        <p><strong>Nội dung:</strong> ${message}</p>
                        <p>Vui lòng đăng nhập vào hệ thống Admin Dashboard để trả lời khách hàng.</p>
                        <hr/>
                        <p><i>Hệ thống thông báo tự động SmashShop</i></p>
                    `;

                    sendmail(adminEmail, html).catch(err => console.error("Lỗi gửi email thông báo chat cho admin:", err));
                }
            }
        });

        // Lấy lịch sử chat của một phòng
        socket.on('chat:history', async ({ userId, adminId }) => {
            const roomId = getRoomId(userId, adminId);
            if (!conversations.has(roomId) || conversations.get(roomId).length === 0) {
                try {
                    const dbMessages = await Message.find({ roomId }).sort({ create_at: 1 }).limit(200);
                    const history = dbMessages.map(msg => ({
                        id: msg.msgId || msg._id.toString(),
                        fromId: msg.fromId,
                        fromName: msg.fromName,
                        fromRole: msg.fromRole,
                        email: msg.email,
                        phone_number: msg.phone_number,
                        email_customer: msg.email_customer,
                        phone_customer: msg.phone_customer,
                        message: msg.message,
                        replyTo: msg.replyTo,
                        avatar: msg.avatar,
                        timestamp: msg.create_at,
                        reactions: msg.reactions ? Object.fromEntries(msg.reactions) : {},
                        isRecalled: msg.isRecalled || false
                    }));
                    conversations.set(roomId, history);
                } catch (err) {
                    console.error("Lỗi fetch history:", err);
                }
            }
            const history = conversations.get(roomId) || [];
            socket.emit('chat:history', { roomId, messages: history });
        });

        // Admin request danh sách online users
        socket.on('admin:getOnlineUsers', () => {
            socket.emit('online:users', getOnlineUsersList());
        });

        // Admin mở chat với user cụ thể
        socket.on('admin:openChat', async ({ adminId, userId }) => {
            const roomId = getRoomId(userId, adminId);
            if (!conversations.has(roomId) || conversations.get(roomId).length === 0) {
                try {
                    const dbMessages = await Message.find({ roomId }).sort({ create_at: 1 }).limit(200);
                    const history = dbMessages.map(msg => ({
                        id: msg.msgId || msg._id.toString(),
                        fromId: msg.fromId,
                        fromName: msg.fromName,
                        fromRole: msg.fromRole,
                        email: msg.email,
                        phone_number: msg.phone_number,
                        email_customer: msg.email_customer,
                        phone_customer: msg.phone_customer,
                        message: msg.message,
                        replyTo: msg.replyTo,
                        avatar: msg.avatar,
                        timestamp: msg.create_at,
                        reactions: msg.reactions ? Object.fromEntries(msg.reactions) : {},
                        isRecalled: msg.isRecalled || false
                    }));
                    conversations.set(roomId, history);
                } catch (err) {
                    console.error("Lỗi fetch history admin open:", err);
                }
            }
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
        socket.on('chat:reaction', async (data) => {
            const { roomId, msgId, reaction, fromId, toId } = data;
            if (conversations.has(roomId)) {
                const msgs = conversations.get(roomId);
                const msg = msgs.find(m => m.id === msgId);
                if (msg) {
                    if (!msg.reactions) msg.reactions = {};
                    if (reaction === null) {
                        delete msg.reactions[fromId];
                    } else {
                        msg.reactions[fromId] = reaction;
                    }
                }
            }

            // Cập nhật reaction vào Database
            try {
                const targetMsg = await Message.findOne({ roomId, msgId });
                if (targetMsg) {
                    if (!targetMsg.reactions) targetMsg.reactions = new Map();
                    if (reaction === null) {
                        targetMsg.reactions.delete(fromId);
                    } else {
                        targetMsg.reactions.set(fromId, reaction);
                    }
                    await targetMsg.save();
                }
            } catch (err) {
                console.error("Lỗi update reaction vào db:", err);
            }

            // Broadcast cho tất cả ai đang quan tâm
            io.emit('chat:reaction:update', { roomId, msgId, reaction, fromId });

            // Nếu user thả cảm xúc -> notify admin (hiện thông báo ngay)
            const sender = onlineUsers.get(fromId);
            if (sender && sender.userInfo.role === 'user') {
                const msgs = conversations.get(roomId) || [];
                const msg = msgs.find(m => m.id === msgId);
                notifyAdmins(io, {
                    fromId,
                    fromName: sender.userInfo.name,
                    avatar: sender.userInfo.avatar,
                    message: `đã thả cảm xúc ${reaction} vào tin nhắn: "${msg?.message || '...'}"`,
                    type: 'reaction'
                });
            }
        });

        // Xử lý thu hồi tin nhắn
        socket.on('chat:recall', async (data) => {
            const { roomId, msgId, fromId } = data;
            
            // Cập nhật ở RAM
            if (conversations.has(roomId)) {
                const msgs = conversations.get(roomId);
                const msg = msgs.find(m => m.id === msgId);
                // Kiểm tra từ đúng người gửi
                if (msg && msg.fromId === fromId) {
                    msg.isRecalled = true;
                }
            }

            // Cập nhật ở Database
            try {
                const targetMsg = await Message.findOne({ roomId, msgId, fromId });
                if (targetMsg) {
                    targetMsg.isRecalled = true;
                    await targetMsg.save();
                }
            } catch (err) {
                console.error("Lỗi thu hồi tin nhắn:", err);
            }

            // Broadcast tới tất cả
            io.emit('chat:recall:update', { roomId, msgId });
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
