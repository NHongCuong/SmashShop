import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./Register.css";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiRegister } from "../../apis/user";
import Swal from 'sweetalert2';

export default function Register({ setIsAuthenticated }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const handleSubmit = async(event) => {
    event.preventDefault(); // ngăn reload page
    const data = {
      name: fullName,
      email,
      password,
    }
    try {
      //Thông báo thành công
      const response = await apiRegister(data);
      Swal.fire('Đăng ký thành công!', '', 'success');
      const token = response.token;
      localStorage.setItem('authToken', token);
      // Lưu user_id vào localStorage
      localStorage.setItem('user_id', response.user.id);
      navigate("/login");
    } catch (err) {
      //Lỗi từ API
      console.log('Lỗi từ API:', err.response?.data || err.message);
      //Hiện thông báo dễ hiểu cho người dùng
      Swal.fire({
        title: 'Lỗi đăng ký',
        text: err.response?.data?.message || 'Thông tin chưa hợp lệ!',
        icon: 'error',
      });
    }
  };

  const navigate = useNavigate();
  const handleGoogleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    setIsAuthenticated(true);
    navigate("/");
  };

  const handleGoogleLoginError = () => {
    console.log('Login Failed');
  };

  return (
    <div className="container">
        <Header/>
        <div className="register-container">
        <div className="register-box">
            <h2>Đăng Ký</h2>
            <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Họ và Tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="register-btn">Đăng Ký</button>
          </form>
          <p className="login-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
