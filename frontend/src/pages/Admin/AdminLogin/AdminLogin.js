import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import { adminLoginThunk } from '../../../app/store/adminAuthThunks';
import Swal from 'sweetalert2';
import { useGetGeneralImagesQuery } from '../../../features/services/generalImageApi';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy ảnh nền từ AdminGeneralLists (qua API)
  const { data: generalImages } = useGetGeneralImagesQuery({ search: 'ADMIN HCSHOP' });
  const adminBgImage = generalImages?.data?.find(img => img.image_name === 'ADMIN HCSHOP')?.image?.[0];

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email.trim() !== '' && password.trim() !== '') {
      try {
        const result = await dispatch(adminLoginThunk({ email, password })).unwrap();

        if (result.user.role !== 'admin') {
          Swal.fire({
            icon: 'error',
            title: 'Không đúng role',
            text: 'Tài khoản này không có quyền truy cập trang quản trị!',
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Đăng nhập thành công!',
          text: 'Chào mừng bạn đến với trang quản trị.',
          timer: 1500,
          showConfirmButton: false,
        });

        navigate('/admin');
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng nhập',
          text: error || 'Sai email hoặc mật khẩu!',
        });
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng nhập đầy đủ email và mật khẩu!',
      });
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: adminBgImage ? `url(${adminBgImage})` : 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="login-overlay"></div>
      <div className="ad-auth-container">
        <div className="ad-logo-placeholder">
          <h2 className="ad-title">HCShop Admin</h2>
        </div>
        <p className="ad-subtitle">Vui lòng đăng nhập để tiếp tục</p>
        <form className="ad-form" onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email quản trị"
              className="ad-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Mật khẩu"
              className="ad-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ad-button">Đăng nhập ngay</button>
        </form>
        <div className="ad-footer">
          <p>&copy; 2026 SmashShop. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;