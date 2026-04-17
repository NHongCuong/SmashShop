import React, { useState } from 'react';
import AdminUserForm from './AdminUserForm/AdminUserForm';
import { useUpdateUserMutation, useGetUserByIdQuery, useGetAdminUsersQuery } from '../../features/user/userApi';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminEditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: userData, isLoading } = useGetUserByIdQuery(id);
  const [updateUser] = useUpdateUserMutation();
  const { refetch } = useGetAdminUsersQuery();
  const [loading, setLoading] = useState(false);

  if (isLoading) return <div>Đang tải dữ liệu...</div>;
  if (!userData?.data) return <div>Không tìm thấy dữ liệu người dùng.</div>;

  const handleEdit = async (dataToSubmit) => {
    setLoading(true);
    try {
      await updateUser({ id, data: dataToSubmit }).unwrap();
      await refetch();
      Swal.fire("Thành công!", "Cập nhật người dùng thành công!", "success");
      navigate('/admin/users');
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
      const msg = error?.data?.message || "Cập nhật người dùng thất bại.";
      Swal.fire("Lỗi!", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-product">
      <AdminUserForm initialData={userData.data} onSubmit={handleEdit} loading={loading} />
    </div>
  );
};

export default AdminEditUser;
