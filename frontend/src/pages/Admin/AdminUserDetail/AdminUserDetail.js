import React from 'react';
import { useGetUserByIdQuery } from '../../../features/user/userApi';
import { useParams } from 'react-router-dom';
import './AdminUserDetail.css';

const AdminUserDetail = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetUserByIdQuery(id);
  const user = data?.data;

  if (isLoading) return <div>Đang tải...</div>;
  if (!user) return <div>Không tìm thấy người dùng</div>;

  return (
    <div className="admin-user-detail">
      <h1>Thông tin người dùng</h1>
      <div className="user-detail-container">
        <div className="admin-user-image">
          <img
            src={user.avatar || 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg'}
            alt={user.name}
            style={{ borderRadius: '50%', objectFit: 'cover', width: '200px', height: '200px' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
            }}
          />
        </div>
        <div className="user-info">
          <p><strong>ID:</strong> {user.user_id}</p>
          <p className="user-name"><strong>Tên người dùng:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Số điện thoại:</strong> {user.phone_number || 'Chưa cập nhật'}</p>
          <p><strong>Role:</strong> <span style={{ padding: '4px 8px', borderRadius: '4px', background: user.role === 'admin' ? '#ffebee' : '#e8f5e9', color: user.role === 'admin' ? '#c62828' : '#2e7d32', fontWeight: 'bold' }}>{user.role}</span></p>
          <p><strong>Địa chỉ:</strong> {user.address || 'Chưa cập nhật'}</p>
          <p><strong>Ngày sinh:</strong> {user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
          <p><strong>Giới tính:</strong> {user.gender || 'Chưa cập nhật'}</p>
          <p><strong>Ngày tạo:</strong> {new Date(user.create_at).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
