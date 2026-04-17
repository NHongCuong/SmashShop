import React, { useState } from 'react';
import AdminUserForm from './AdminUserForm/AdminUserForm';
import { useCreateUserMutation, useGetAdminUsersQuery } from '../../features/user/userApi';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminAddUser = () => {
  const navigate = useNavigate();
  const [createUser] = useCreateUserMutation();
  const { refetch } = useGetAdminUsersQuery();
  const [loading, setLoading] = useState(false);

  const handleAdd = async (dataToSubmit) => {
    setLoading(true);
    try {
      await createUser(dataToSubmit).unwrap();
      await refetch();
      Swal.fire("Thành công!", "Thêm người dùng mới thành công!", "success");
      navigate('/admin/users');
    } catch (error) {
      console.error("Lỗi khi thêm người dùng:", error);
      const msg = error?.data?.message || "Thêm người dùng thất bại.";
      Swal.fire("Lỗi!", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-product">
      <AdminUserForm onSubmit={handleAdd} loading={loading} />
    </div>
  );
};

export default AdminAddUser;
