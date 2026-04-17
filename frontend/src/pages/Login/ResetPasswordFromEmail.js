import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import "./Login.css";
import Swal from "sweetalert2";
import { apiResetPassword } from "../../apis/user";

export default function ResetPasswordFromEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      Swal.fire({ title: "Lỗi", text: "Vui lòng nhập đầy đủ thông tin!", icon: "error" });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({ title: "Lỗi", text: "Mật khẩu xác nhận không khớp!", icon: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await apiResetPassword({ password, token });
      await Swal.fire("Thành công!", "Mật khẩu đã được thiết lập lại thành công.", "success");
      navigate("/login");
    } catch (err) {
      console.log("Lỗi từ API:", err);
      Swal.fire({
        title: "Lỗi",
        text: err.response?.data?.message || "Lỗi khi reset mật khẩu, link có thể đã hết hạn!",
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
          <h2>Tạo mật khẩu mới</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
