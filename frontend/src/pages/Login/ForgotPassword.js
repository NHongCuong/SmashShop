import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./Login.css";
import Swal from "sweetalert2";
import { apiForgotPassword } from "../../apis/user";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      Swal.fire({
        title: "Lỗi",
        text: "Vui lòng nhập email!",
        icon: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiForgotPassword({ email });
      Swal.fire("Thành công!", response.message || "Link khôi phục mật khẩu đã được gửi vào email của bạn.", "success");
    } catch (err) {
      console.log("Lỗi từ API:", err);
      Swal.fire({
        title: "Lỗi",
        text: err.response?.data?.message || "Không thể gửi email lúc này!",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="login-container">
        <div className="login-box">
          <h2>Quên mật khẩu</h2>
          <p style={{ textAlign: "center", marginBottom: "20px", color: "#555" }}>
            Nhập email của bạn để nhận link đặt lại mật khẩu.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Đang gửi..." : "Gửi link khôi phục"}
            </button>
          </form>

          <p className="register-link" style={{ marginTop: "15px" }}>
            Quay lại <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
