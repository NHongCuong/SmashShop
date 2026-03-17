import React from "react";
import { useState } from "react";
import "./ResetPassword.css";


const ResetPassword = () => {

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    console.log('Đặt lại mật khẩu thành công với:', newPassword);
    alert('Mật khẩu của bạn đã được thay đổi thành công!');
    // gọi API thực hiện thay đổi mật khẩu
  };
  return (
    <div className="orders-history">
      <h2>Đặt Lại Mật Khẩu</h2>
      <form onSubmit={handleSubmit} className="reset-password-form">
        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Xác nhận</button>
      </form>
    </div>
  );
};

export default ResetPassword;
