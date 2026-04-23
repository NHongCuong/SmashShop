import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./Login.css";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { loginThunk } from "../../app/store/authThunks";
import { logout, setAccessToken } from "../../app/store/authSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(localStorage.getItem("remember_email") || "");
  const [password, setPassword] = useState(localStorage.getItem("remember_password") || "");
  const [rememberMe, setRememberMe] = useState(localStorage.getItem("rememberMe") === "true");

  useEffect(() => {
    // Xử lý sau khi redirect từ Google Login
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userJson = params.get('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));

        // Lưu thông tin vào localStorage tương tự loginThunk
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem("isAuthenticated", "true");

        dispatch(setAccessToken({ token, user }));

        Swal.fire({
          icon: 'success',
          title: 'Đăng nhập Google thành công!',
          timer: 1500,
          showConfirmButton: false
        });
        navigate("/");
      } catch (error) {
        console.error("Lỗi parse dữ liệu Google:", error);
      }
    }
  }, [location, dispatch, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(loginThunk({ email, password })).unwrap();

      // Chặn nếu không phải user hoặc admin
      if (result.user.role !== 'user' && result.user.role !== 'admin') {
        dispatch(logout());
        Swal.fire({
          icon: 'error',
          title: 'Không đúng role',
          text: 'Tài khoản này không được phép truy cập!',
        });
        return;
      }

      // Xử lý Ghi nhớ mật khẩu
      if (rememberMe) {
        localStorage.setItem("remember_email", email);
        localStorage.setItem("remember_password", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("remember_email");
        localStorage.removeItem("remember_password");
        localStorage.setItem("rememberMe", "false");
      }

      Swal.fire('Đăng nhập thành công!', '', 'success');
      navigate("/");
    } catch (err) {
      console.log('Lỗi từ API:', err);
      Swal.fire({
        title: 'Lỗi đăng nhập',
        text: typeof err === 'string' ? err : 'Sai email hoặc mật khẩu!',
        icon: 'error',
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  return (
    <div className="container">
      <Header />
      <div className="login-container">
        <div className="login-box">
          <h2>Đăng Nhập</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="remember-me" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', fontSize: '14px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 'auto', marginBottom: '0', marginRight: '8px' }}
              />
              <label htmlFor="rememberMe" style={{ cursor: 'pointer' }}>Ghi nhớ mật khẩu</label>
            </div>

            <button type="submit" className="login-btn">Đăng Nhập</button>
          </form>

          <div style={{ margin: '15px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }}></div>
            <span style={{ margin: '0 10px', color: '#888', fontSize: '13px' }}>Hoặc</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }}></div>
          </div>

          <button onClick={handleGoogleLogin} className="google-login-btn" style={{
            width: '100%',
            padding: '10px',
            background: '#fff',
            color: '#444',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faGoogle} style={{ color: '#db4437' }} />
            Đăng nhập với Google
          </button>

          <p className="register-link" style={{ marginBottom: "5px", marginTop: '20px' }}>
            <Link to="/forgot-password" style={{ fontSize: "14px", color: "#1890ff" }}>Quên mật khẩu?</Link>
          </p>
          <p className="register-link">
            Bạn chưa có tài khoản? <Link to="/register" style={{ color: '#1890ff', fontWeight: 'bold' }}>Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
