import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faCartShopping,
  faPlus,
  faBox,
  faUsers,
  faUserPlus,
  faBars,
  faXmark,
  faRightFromBracket,
  faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogout } from '../../../app/store/adminAuthSlice';
import AdminLiveChat from '../../../components/LiveChat/AdminLiveChat';
import { useSocket } from '../../../context/SocketContext';
import { userApi } from '../../../features/user/userApi';
import { orderApi } from '../../../features/order/orderApi';
import { productApi } from '../../../features/product/productApi';
import { categoryApi } from '../../../features/services/categoryApi';
import { reviewApi } from '../../../features/services/reviewApi';
import { statisticsApi } from '../../../features/statistics/statisticsApi';
import { wishlistApi } from '../../../features/services/wishlistApi';

const NOTIF_STORAGE_KEY = 'admin_chat_notifications';

function loadNotificationsFromStorage() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotificationsToStorage(notifs) {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs.slice(0, 20)));
  } catch {}
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const adminUser = useSelector((state) => state.adminAuth.user);
  const { socket } = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Khởi tạo từ localStorage để giữ thông báo sau khi refresh
  const [notifications, setNotifications] = useState(loadNotificationsFromStorage);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [chatOpenUserId, setChatOpenUserId] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    dispatch(adminLogout());
    
    // Reset RTK Query caches
    dispatch(userApi.util.resetApiState());
    dispatch(orderApi.util.resetApiState());
    dispatch(productApi.util.resetApiState());
    dispatch(categoryApi.util.resetApiState());
    dispatch(reviewApi.util.resetApiState());
    dispatch(statisticsApi.util.resetApiState());
    dispatch(wishlistApi.util.resetApiState());

    navigate('/admin-login');
  };

  // Lắng nghe thông báo tin nhắn mới từ user
  useEffect(() => {
    if (!socket || !adminUser) return;

    const handler = (data) => {
      const { fromId, fromName, avatar, message, type } = data;
      setNotifications((prev) => {
        // Tránh duplicate: nếu đã có từ user này với message giống hệt thì bỏ qua
        const isDuplicate = prev.some(
          (n) => n.fromId === fromId && n.message === message
        );
        if (isDuplicate) return prev;

        const updated = [
          { fromId, fromName, avatar, message, type, time: new Date().toISOString(), read: false },
          ...prev.slice(0, 19),
        ];
        saveNotificationsToStorage(updated);
        return updated;
      });
    };

    socket.on('admin:newMessage', handler);
    return () => {
      socket.off('admin:newMessage', handler);
    };
  }, [socket, adminUser]);

  // Click vào thông báo → mở chat với user đó + đánh dấu đã đọc
  const handleNotifClick = (notif, index) => {
    setChatOpenUserId(notif.fromId);
    setShowNotifDropdown(false);
    // Đánh dấu đã đọc
    setNotifications((prev) => {
      const updated = prev.map((n, i) => i === index ? { ...n, read: true } : n);
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  // Xóa tất cả thông báo
  const handleClearAll = () => {
    setNotifications([]);
    localStorage.removeItem(NOTIF_STORAGE_KEY);
  };

  // Xóa 1 thông báo đã đọc riêng lẻ
  const handleDismissNotif = (e, index) => {
    e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveNotificationsToStorage(updated);
      return updated;
    });
  };

  const handleChatOpened = useCallback(() => {
    setChatOpenUserId(null);
  }, []);

  const handleOpenChatFromCustomers = useCallback((userId) => {
    setChatOpenUserId(userId);
  }, []);

  // Số thông báo chưa đọc
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="ad-container">
      <header className="ad-header">
        <button className="ad-menu-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} />
        </button>
        ADMIN DASHBOARD
        {/* Notification Bell */}
        <div className="ad-header-actions">
          <div className="ad-notif-wrapper">
            <button
              className="ad-notif-btn"
              onClick={() => setShowNotifDropdown((v) => !v)}
              title="Thông báo tin nhắn"
            >
              📩
              {unreadCount > 0 && (
                <span className="ad-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="ad-notif-dropdown">
                <div className="ad-notif-header">
                  <span>Tin nhắn ({notifications.length})</span>
                  {notifications.length > 0 && (
                    <button
                      className="ad-notif-clear"
                      onClick={handleClearAll}
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="ad-notif-empty">Không có thông báo mới</div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      className={`ad-notif-item ${n.read ? 'read' : 'unread'}`}
                      onClick={() => handleNotifClick(n, i)}
                    >
                      <img
                        src={n.avatar || 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg'}
                        alt={n.fromName}
                        className="ad-notif-avatar"
                        onError={(e) => { e.target.src = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg'; }}
                      />
                      <div className="ad-notif-content">
                        <div className="ad-notif-name">{n.fromName}</div>
                        <div className="ad-notif-msg">{n.message}</div>
                        {n.read && <div className="ad-notif-read-tag">✓ Đã đọc</div>}
                      </div>
                      <button
                        className="ad-notif-dismiss"
                        onClick={(e) => handleDismissNotif(e, i)}
                        title="Xóa thông báo này"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="ad-body">
        <aside className={`ad-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <h2 className="ad-logo">Smash shop</h2>
          <nav className="ad-nav" onClick={closeSidebar}>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faGauge} /> Tổng quan
            </NavLink>
            <NavLink to="/admin/products" end className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faBox} /> Sản phẩm hiện có
            </NavLink>
            <NavLink to="/admin/products/add" className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faPlus} /> Thêm sản phẩm mới
            </NavLink>
            <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faCartShopping} /> Đơn hàng
            </NavLink>
            <NavLink to="/admin/users" end className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faUsers} /> Người dùng hiện có
            </NavLink>
            <NavLink to="/admin/users/add" className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faUserPlus} /> Thêm người dùng mới
            </NavLink>
            <NavLink to="/admin/customers" className={({ isActive }) => isActive ? 'ad-nav-item active' : 'ad-nav-item'}>
              <FontAwesomeIcon icon={faHeadset} /> Chăm sóc khách hàng
            </NavLink>
            <button className="ad-nav-item-logout" onClick={handleLogout}>
              <FontAwesomeIcon icon={faRightFromBracket} /> Đăng xuất
            </button>
          </nav>
        </aside>

        <main className="ad-main">
          <Outlet context={{ onOpenChat: handleOpenChatFromCustomers }} />
        </main>
      </div>

      {/* Admin Live Chat Widget */}
      <AdminLiveChat
        openWithUserId={chatOpenUserId}
        onNotifHandled={handleChatOpened}
      />
    </div>
  );
}