import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { loginThunk } from "../../app/store/authThunks";
import { logout } from "../../app/store/authSlice";






export default function Login() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();



  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(loginThunk({ email, password })).unwrap();
  
      // Chặn nếu không phải user
      if (result.user.role !== 'user') {
        dispatch(logout());
        Swal.fire({
          icon: 'error',
          title: 'Không đúng role',
          text: 'Tài khoản này không được phép truy cập trang người dùng!',
        });
        return;
      }
  
      Swal.fire('Đăng nhập thành công!', '', 'success');
      navigate("/");
    } catch (err) {
      console.log('Lỗi từ API:', err.message);
      Swal.fire({
        title: 'Lỗi đăng nhập',
        text: err.message || 'Sai email hoặc mật khẩu!',
        icon: 'error',
      });
    }
    
  };

  const handleGoogleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    // setIsAuthenticated(true);
    navigate("/");
  };

  const handleGoogleLoginError = () => {
    console.log('Login Failed');
  };

  return (
    <div className="container">
    <Header/>
        <div className="login-container">
        <div className="login-box">
            <h2>Đăng Nhập</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // required
                />
                <input
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    //required
                />
                <button type="submit" className="login-btn">Đăng Nhập</button>
            </form>
            
            <p className="register-link">
            Bạn chưa có tài khoản? <Link to="/register">Đăng ký</Link>
            </p>
        </div>
        </div>
    </div>
  );
}
