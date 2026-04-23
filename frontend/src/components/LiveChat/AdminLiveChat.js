import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import './LiveChat.css';

const DEFAULT_AVATAR = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
const ADMIN_ID = 'ADMIN_SUPPORT';

function formatTime(date) {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

/* ========== ADMIN CHAT WIDGET ========== */
export default function AdminLiveChat({ openWithUserId, onNotifHandled }) {
    const { socket } = useSocket();
    const adminUser = useSelector((state) => state.adminAuth.user);
    const [open, setOpen] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [conversations, setConversations] = useState({}); // { userId: [msgs] }
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    const adminId = adminUser?.id || adminUser?._id || ADMIN_ID;
    const adminName = adminUser?.name || 'Admin';
    const adminAvatar = adminUser?.avatar || DEFAULT_AVATAR;

    // Đăng ký admin socket + nhận events
    useEffect(() => {
        if (!socket || !adminUser) return;

        socket.emit('user:register', {
            userId: ADMIN_ID,
            name: adminName,
            email: adminUser.email,
            role: 'admin',
            avatar: adminAvatar,
        });

        socket.emit('admin:getOnlineUsers');

        socket.on('online:users', (users) => {
            setOnlineUsers(users);
        });

        socket.on('message:receive', ({ msg }) => {
            const uid = msg.fromId;
            setConversations((prev) => ({
                ...prev,
                [uid]: [...(prev[uid] || []), msg],
            }));
            if (!open || selectedUserId !== uid) {
                setUnread((u) => u + 1);
            }
        });

        socket.on('message:sent', ({ msg }) => {
            // đã thêm vào UI ngay khi gửi
        });

        socket.on('chat:history', ({ messages: msgs }) => {
            if (!msgs || !msgs.length) return;
            // Tìm userId của khách hàng trong cuộc hội thoại
            const userMsg = msgs.find((m) => m.fromRole === 'user');
            const adminMsg = msgs.find((m) => m.fromRole === 'admin');
            let uid = null;
            if (userMsg) {
                uid = userMsg.fromId;
            } else if (adminMsg) {
                uid = adminMsg.toId;
            }
            if (uid) {
                setConversations((prev) => ({ ...prev, [uid]: msgs }));
            }
        });

        socket.on('admin:newMessage', ({ fromId, fromName, avatar, message }) => {
            setConversations((prev) => ({
                ...prev,
                // history lấy từ event message:receive
            }));
        });

        return () => {
            socket.off('online:users');
            socket.off('message:receive');
            socket.off('message:sent');
            socket.off('chat:history');
            socket.off('admin:newMessage');
        };
    }, [socket, adminUser, open, selectedUserId]);

    // Khi được yêu cầu mở chat với user nhất định (từ notification hoặc nút Chat)
    useEffect(() => {
        if (openWithUserId) {
            setOpen(true);
            setSelectedUserId(openWithUserId);
            // Request lịch sử
            if (socket) {
                socket.emit('chat:history', { userId: openWithUserId, adminId: ADMIN_ID });
            }
            // Thông báo cho parent rằng đã xử lý (nhưng KHÔNG đóng chat)
            // Delay nhỏ để tránh re-render xung đột
            setTimeout(() => {
                if (onNotifHandled) onNotifHandled();
            }, 100);
        }
    }, [openWithUserId]); // eslint-disable-line

    // Scroll to bottom
    useEffect(() => {
        if (open) {
            setUnread(0);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    }, [open, conversations, selectedUserId]);

    const handleSelectUser = (uid) => {
        setSelectedUserId(uid);
        if (socket) {
            socket.emit('chat:history', { userId: uid, adminId: ADMIN_ID });
        }
    };

    const handleSend = useCallback(() => {
        if (!input.trim() || !socket || !selectedUserId) return;
        const msgObj = {
            fromId: ADMIN_ID,
            fromName: adminName,
            fromRole: 'admin',
            toId: selectedUserId,
            toRole: 'user',
            message: input.trim(),
            avatar: adminAvatar,
        };
        // Thêm vào UI ngay
        setConversations((prev) => ({
            ...prev,
            [selectedUserId]: [...(prev[selectedUserId] || []), {
                ...msgObj,
                id: Date.now(),
                timestamp: new Date(),
            }],
        }));
        socket.emit('message:send', msgObj);
        setInput('');
    }, [input, socket, selectedUserId, adminName, adminAvatar]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (!adminUser) return null;

    const messages = selectedUserId ? (conversations[selectedUserId] || []) : [];
    const selectedUser = onlineUsers.find((u) => u.userId === selectedUserId);

    return (
        <div className="chat-widget">
            {open && (
                <div className="chat-box">
                    <div className="chat-box-header">
                        <img
                            src={selectedUser?.avatar || DEFAULT_AVATAR}
                            alt="User"
                            className="chat-box-header-avatar"
                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                        />
                        <div className="chat-box-header-info">
                            <div className="chat-box-header-name">
                                {selectedUser ? selectedUser.name : 'Chăm sóc khách hàng'}
                            </div>
                            <div className="chat-box-header-status">
                                <span className="status-dot" />
                                {onlineUsers.length} khách đang online
                            </div>
                        </div>
                        <button className="chat-box-close" onClick={() => setOpen(false)}>×</button>
                    </div>

                    {/* Chọn user để chat */}
                    <div className="chat-admin-selector">
                        <label>Khách hàng:</label>
                        <select
                            value={selectedUserId || ''}
                            onChange={(e) => handleSelectUser(e.target.value)}
                        >
                            <option value="">-- Chọn khách hàng --</option>
                            {onlineUsers.map((u) => (
                                <option key={u.userId} value={u.userId}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Messages */}
                    {!selectedUserId ? (
                        <div className="chat-no-target">
                            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                            Chọn khách hàng để bắt đầu chat
                        </div>
                    ) : (
                        <div className="chat-messages">
                            {messages.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 14 }}>
                                    Chưa có tin nhắn nào
                                </div>
                            )}
                            {messages.map((msg, i) => {
                                const isMe = msg.fromRole === 'admin';
                                return (
                                    <div key={msg.id || i} className={`chat-msg-row ${isMe ? 'me' : 'other'}`}>
                                        <img
                                            src={msg.avatar || DEFAULT_AVATAR}
                                            alt={msg.fromName}
                                            className="chat-msg-avatar"
                                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                                        />
                                        <div>
                                            {!isMe && <div className="chat-msg-name">{msg.fromName}</div>}
                                            <div className="chat-msg-bubble">{msg.message}</div>
                                            <div className="chat-msg-time">{formatTime(msg.timestamp)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {selectedUserId && (
                        <div className="chat-input-area">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tin nhắn..."
                                autoFocus
                            />
                            <button className="chat-send-btn" onClick={handleSend}>
                                <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <button className="chat-toggle-btn" onClick={() => setOpen((o) => !o)} title="Chat hỗ trợ">
                {open ? (
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                ) : (
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                )}
                {unread > 0 && <span className="chat-toggle-badge">{unread}</span>}
            </button>
        </div>
    );
}
