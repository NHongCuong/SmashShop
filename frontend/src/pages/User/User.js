import Header from "../../components/Header/Header";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../app/store/authSlice";
import Footer from "../../components/Footer/Footer";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faClipboardList, faLock, faSignOutAlt, faBars } from "@fortawesome/free-solid-svg-icons";
import { Link, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import "./User.css";

export default function User({ isAuthenticated, setIsAuthenticated }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State hiển thị modal
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  if (location.pathname === "/user") {
    return <Navigate to="/user/profile" replace />;
  }

  // Danh sách menu sidebar
  const menuItems = [
    { label: "Thông tin tài khoản", icon: faUser, path: "/user/profile" },
    { label: "Đơn hàng đã đặt", icon: faClipboardList, path: "/user/orders" },
    { label: "Đổi mật khẩu", icon: faLock, path: "/user/reset-password" },
    { label: "Đăng xuất", icon: faSignOutAlt, path: "#" }, 
  ];

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    // console.log("Logout")
    // Xóa token và thông tin người dùng khỏi localStorage
    dispatch(logout());
    navigate("/");
    localStorage.removeItem("isAuthenticated"); // Xóa dữ liệu đăng nhập
  };

  return (
    <>
      <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated}/>

      <div className="user-container">
        <div className="user-header-container">
          <p className="user-header">TRANG CHỦ {'>'} TRANG CÁ NHÂN</p>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FontAwesomeIcon icon={faBars} color="white" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="user-body">
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={(e) => {
                if (item.label === "Đăng xuất") {
                  e.preventDefault();
                  setShowLogoutModal(true);
                } else {
                  setIsSidebarOpen(false); // Đóng sidebar sau khi chọn
                }
              }}
            >
              <FontAwesomeIcon icon={item.icon} className="sidebar-icon" />
              {item.label}
            </Link>
          ))}
        </div>

          {/* Nội dung chi tiết */}
          <div className="user-content">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Modal xác nhận đăng xuất */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="user-modal">
            <p>Bạn có chắc chắn muốn đăng xuất?</p>
            <div className="user-modal-buttons">
              <button className="modal-btn confirm" onClick={handleLogout}>Đăng xuất</button>
              <button className="modal-btn cancel" onClick={() => setShowLogoutModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      <Footer/>
    </>
  );
}
