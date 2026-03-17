import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import { loginThunk } from '../../../app/store/authThunks';
import Swal from 'sweetalert2';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email.trim() !== '' && password.trim() !== '') {
      try {
        const result = await dispatch(loginThunk({ email, password })).unwrap();

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
    <div className="login-container">
      <div className="ad-auth-container">
        <h2 className="ad-title">Đăng nhập Quản trị viên</h2>
        <form className="ad-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="ad-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="ad-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="ad-button">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;