import React, { useState } from "react";
import "./ResetPassword.css";
import { useUpdateProfileMutation } from "../../../features/user/userApi";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await updateProfile({ password: newPassword }).unwrap();
      alert('Mật khẩu của bạn đã được thay đổi thành công!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      alert('Đã xảy ra lỗi khi cập nhật mật khẩu.');
    }
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
