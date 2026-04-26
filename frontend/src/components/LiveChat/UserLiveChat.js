import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import './LiveChat.css';

const DEFAULT_AVATAR = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
const ADMIN_ID = 'ADMIN_SUPPORT';
const ADMIN_NAME = 'Hỗ trợ khách hàng';
const ADMIN_AVATAR = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
const REACTIONS = ['❤️', '😆', '😮', '😢', '😡', '👍'];
const INPUT_EMOJIS = ['😊', '😂', '😍', '😭', '😡', '👍', '🙏', '❤️', '😁', '🥰', '🥺', '🎉'];

function formatTime(date) {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
    const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);

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
            setIsOtherTyping(false); // Dừng typing khi nhận tin nhắn
        });

        socket.on('message:sent', ({ msg }) => {
            // đã thêm khi gửi, không cần thêm nữa
        });

        socket.on('chat:typing', ({ fromId, isTyping: typingStatus, role }) => {
            if (role === 'admin') {
                setIsOtherTyping(typingStatus);
            }
        });

        socket.on('chat:reaction:update', ({ msgId, reaction, fromId }) => {
            setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                    const newReactions = { ...(m.reactions || {}) };
                    if (reaction === null) {
                        delete newReactions[fromId];
                    } else {
                        newReactions[fromId] = reaction;
                    }
                    return { ...m, reactions: newReactions };
                }
                return m;
            }));
            if (!open && fromId !== userId) setUnread(u => u + 1);
        });

        socket.on('chat:recall:update', ({ msgId }) => {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRecalled: true } : m));
        });

        return () => {
            socket.off('chat:history');
            socket.off('message:receive');
            socket.off('message:sent');
            socket.off('chat:typing');
            socket.off('chat:reaction:update');
            socket.off('chat:recall:update');
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
        const msgId = Date.now();
        const msgObj = {
            id: msgId,
            fromId: userId,
            fromName: user.name,
            fromRole: 'user',
            toId: ADMIN_ID,
            toRole: 'admin',
            message: input.trim(),
            replyTo: replyingTo ? { id: replyingTo.id, name: replyingTo.fromName, message: replyingTo.message } : null,
            avatar: user.avatar || DEFAULT_AVATAR,
        };
        // Thêm tin nhắn vào UI ngay
        setMessages((prev) => [...prev, {
            ...msgObj,
            timestamp: new Date(),
        }]);
        socket.emit('message:send', msgObj);
        setInput('');
        setReplyingTo(null);
        const textarea = document.querySelector('.chat-widget .chat-input-area textarea');
        if (textarea) textarea.style.height = 'auto';
        if (socket) socket.emit('chat:typing', { fromId: userId, toId: ADMIN_ID, isTyping: false, role: 'user' });
    }, [input, socket, userId, user, replyingTo]);

    const handleReact = (msgId, emoji) => {
        if (socket) {
            // Cập nhật UI ngay lập tức (Optimistic UI)
            setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                    const newReactions = { ...(m.reactions || {}) };
                    if (emoji === null) {
                        delete newReactions[userId];
                    } else {
                        newReactions[userId] = emoji;
                    }
                    return { ...m, reactions: newReactions };
                }
                return m;
            }));

            const roomId = [userId, ADMIN_ID].sort().join('_');
            socket.emit('chat:reaction', { roomId, msgId, reaction: emoji, fromId: userId, toId: ADMIN_ID });
        }
        setActiveReactionMsgId(null);
    };

    const handleRecall = (msgId) => {
        if (!socket || !userId) return;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRecalled: true } : m));
        const roomId = [userId, ADMIN_ID].sort().join('_');
        socket.emit('chat:recall', { roomId, msgId, fromId: userId });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
        if (socket) {
            socket.emit('chat:typing', { fromId: userId, toId: ADMIN_ID, isTyping: e.target.value.length > 0, role: 'user' });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('chat:typing', { fromId: userId, toId: ADMIN_ID, isTyping: false, role: 'user' });
            }, 2000);
        }
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
                                    <div className="chat-msg-content-wrapper">
                                        {!isMe && <div className="chat-msg-name">{msg.fromName}</div>}

                                        <div className={`chat-msg-bubble-container ${activeReactionMsgId === msg.id ? 'reaction-active' : ''}`}>
                                            <div className="chat-msg-actions">
                                                <button onClick={() => setReplyingTo(msg)} title="Trả lời">↩</button>
                                                <button onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)} title="Thả cảm xúc">🙂</button>
                                                {isMe && !msg.isRecalled && (
                                                    <button onClick={() => handleRecall(msg.id)} title="Thu hồi tin nhắn">🗑️</button>
                                                )}
                                            </div>

                                            <div className="chat-msg-bubble-wrapper">
                                                {activeReactionMsgId === msg.id && (
                                                    <div className="chat-reaction-picker">
                                                        {REACTIONS.map(r => (
                                                            <span key={r} onClick={() => handleReact(msg.id, r)}>{r}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {msg.replyTo && (
                                                    <div className="chat-msg-reply-quote">
                                                        <strong>{msg.replyTo.name}</strong>: {msg.replyTo.message}
                                                    </div>
                                                )}
                                                {msg.isRecalled ? (
                                                    <div className="chat-msg-bubble recalled-msg"><i>Tin nhắn đã thu hồi</i></div>
                                                ) : (
                                                    <div className="chat-msg-bubble">{msg.message}</div>
                                                )}
                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                    <div className="chat-msg-reactions-display">
                                                        {Object.entries(msg.reactions).map(([reactionUserId, r], idx) => (
                                                            <span 
                                                                key={idx} 
                                                                onDoubleClick={() => { if (reactionUserId === userId) handleReact(msg.id, null); }}
                                                                title={reactionUserId === userId ? "Nhấp đúp để xóa" : ""}
                                                            >{r}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="chat-msg-time">{formatTime(msg.timestamp)}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {replyingTo && (
                        <div className="chat-reply-preview">
                            <div>Đang trả lời <strong>{replyingTo.fromName}</strong>: {replyingTo.message}</div>
                            <button onClick={() => setReplyingTo(null)}>×</button>
                        </div>
                    )}

                    {isOtherTyping && (
                        <div className="chat-typing-status">Đang soạn tin nhắn...</div>
                    )}

                    <div className="chat-input-area">
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập tin nhắn..."
                            autoFocus
                            rows={1}
                        />
                        <button className="chat-input-emoji-btn" onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)} title="Chèn Emoji">
                            🙂
                        </button>
                        {showInputEmojiPicker && (
                            <div className="chat-input-emoji-picker">
                                {INPUT_EMOJIS.map(e => (
                                    <span key={e} onClick={() => {
                                        setInput(prev => prev + e);
                                        setShowInputEmojiPicker(false);
                                        if (socket) socket.emit('chat:typing', { fromId: userId, toId: ADMIN_ID, isTyping: true, role: 'user' });
                                    }}>
                                        {e}
                                    </span>
                                ))}
                            </div>
                        )}
                        <button className="chat-send-btn" onClick={handleSend}>
                            <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <button className="chat-toggle-btn" onClick={() => setOpen((o) => !o)} title="Chat hỗ trợ">
                {open ? (
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                ) : (
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" /></svg>
                )}
                {unread > 0 && <span className="chat-toggle-badge">{unread}</span>}
            </button>
        </div>
    );
}
