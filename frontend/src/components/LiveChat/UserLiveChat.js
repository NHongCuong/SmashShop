import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import './LiveChat.css';

const DEFAULT_AVATAR = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
const ADMIN_ID = 'ADMIN_SUPPORT';
const ADMIN_NAME = 'Hỗ trợ khách hàng';
const ADMIN_AVATAR = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';

function formatTime(date) {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

/* ========== USER CHAT WIDGET ========== */
export default function UserLiveChat() {
    const { socket } = useSocket();
    const user = useSelector((state) => state.auth.user);
    const reduxUserId = useSelector((state) => state.auth.userId);
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef(null);

    const userId = reduxUserId || user?.id || user?._id;

    // Đăng ký user với socket server
    useEffect(() => {
        if (!socket || !userId) return;

        socket.emit('user:register', {
            userId,
            name: user.name,
            email: user.email,
            role: 'user',
            avatar: user.avatar || DEFAULT_AVATAR,
            phone_number: user.phone_number,
            address: user.address,
            dob: user.dob,
            gender: user.gender,
            create_at: user.create_at,
        });

        // Lấy lịch sử chat
        socket.emit('chat:history', { userId, adminId: ADMIN_ID });

        socket.on('chat:history', ({ messages: msgs }) => {
            setMessages(msgs || []);
        });

        socket.on('message:receive', ({ msg }) => {
            setMessages((prev) => [...prev, msg]);
            if (!open) setUnread((u) => u + 1);
        });

        socket.on('message:sent', ({ msg }) => {
            // đã thêm khi gửi, không cần thêm nữa
        });

        return () => {
            socket.off('chat:history');
            socket.off('message:receive');
            socket.off('message:sent');
        };
    }, [socket, userId, open]);

    useEffect(() => {
        if (open) {
            setUnread(0);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [open, messages]);

    const handleSend = useCallback(() => {
        if (!input.trim() || !socket || !userId) return;
        const msgObj = {
            fromId: userId,
            fromName: user.name,
            fromRole: 'user',
            toId: ADMIN_ID,
            toRole: 'admin',
            message: input.trim(),
            avatar: user.avatar || DEFAULT_AVATAR,
        };
        // Thêm tin nhắn vào UI ngay
        setMessages((prev) => [...prev, {
            ...msgObj,
            id: Date.now(),
            timestamp: new Date(),
        }]);
        socket.emit('message:send', msgObj);
        setInput('');
    }, [input, socket, userId, user]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (!userId) return null;

    return (
        <div className="chat-widget">
            {open && (
                <div className="chat-box">
                    <div className="chat-box-header">
                        <img
                            src={ADMIN_AVATAR}
                            alt="Admin"
                            className="chat-box-header-avatar"
                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                        />
                        <div className="chat-box-header-info">
                            <div className="chat-box-header-name">{ADMIN_NAME}</div>
                            <div className="chat-box-header-status">
                                <span className="status-dot" /> Trực tuyến
                            </div>
                        </div>
                        <button className="chat-box-close" onClick={() => setOpen(false)}>×</button>
                    </div>

                    <div className="chat-messages" ref={messagesEndRef}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 14 }}>
                                👋 Xin chào! Chúng tôi có thể giúp gì cho bạn?
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = msg.fromId === userId;
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
