import React, { useEffect, useState } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useOutletContext } from 'react-router-dom';
import './AdminCustomers.css';

const DEFAULT_AVATAR = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';

export default function AdminCustomers() {
    const { socket } = useSocket();
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Lấy hàm mở chat từ AdminDashboard qua Outlet context
    const { onOpenChat } = useOutletContext() || {};

    useEffect(() => {
        if (!socket) return;

        socket.emit('admin:getOnlineUsers');

        const handler = (users) => {
            setOnlineUsers(users);
        };

        socket.on('online:users', handler);

        return () => {
            socket.off('online:users', handler);
        };
    }, [socket]);

    const handleChatClick = (userId) => {
        if (onOpenChat) {
            onOpenChat(userId);
        }
    };

    return (
        <div className="admin-customers">
            <h1>Chăm sóc khách hàng</h1>
            <p className="customers-subtitle">
                Khách hàng đang online: <strong>{onlineUsers.length}</strong>
            </p>

            <div className="customers-table-wrap">
                <table className="customers-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Ảnh</th>
                            <th>Tên người dùng</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Địa chỉ</th>
                            <th>Ngày sinh</th>
                            <th>Giới tính</th>
                            <th>Ngày tạo</th>
                            <th>Tình trạng</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {onlineUsers.length === 0 ? (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', color: '#bbb', padding: '40px' }}>
                                    Chưa có khách hàng nào đang online
                                </td>
                            </tr>
                        ) : (
                            onlineUsers.map((user, idx) => (
                                <tr key={user.userId}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <img
                                            src={user.avatar || DEFAULT_AVATAR}
                                            alt={user.name}
                                            className="customer-avatar"
                                            onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                                        />
                                    </td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone_number || '—'}</td>
                                    <td>{user.address || '—'}</td>
                                    <td>{user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '—'}</td>
                                    <td>{user.gender || '—'}</td>
                                    <td>{user.create_at ? new Date(user.create_at).toLocaleDateString('vi-VN') : '—'}</td>
                                    <td>
                                        <span className="status-badge online">🟢 Online</span>
                                    </td>
                                    <td>
                                        <button
                                            className="chat-action-btn"
                                            onClick={() => handleChatClick(user.userId)}
                                        >
                                            💬 Chat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
