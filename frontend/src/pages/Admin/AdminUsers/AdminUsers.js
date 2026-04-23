import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminUsers.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useGetAdminUsersQuery, useDeleteUserMutation } from '../../../features/user/userApi';
import Swal from 'sweetalert2';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("create_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: queryData, refetch, isLoading } = useGetAdminUsersQuery({ page, limit, sortBy: sortField, sortOrder, search: searchTerm });
  const users = queryData?.data || [];
  const totalPages = queryData?.totalPages || 1;

  const [deleteUser] = useDeleteUserMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();

  const handleDelete = (userId) => {
    setUserToDelete(userId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete).unwrap();
      Swal.fire("Thành công!", "Đã xóa người dùng thành công!", "success");
      refetch();
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
      Swal.fire("Lỗi!", "Có lỗi xảy ra khi xóa người dùng.", "error");
    }
    setShowConfirm(false);
    setUserToDelete(null);
  };

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('-');
    setSortField(field);
    setSortOrder(order);
    setPage(1);
  };

  return (
    <div className="admin-users">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Người dùng hiện có</h1>
        <button
          onClick={() => navigate('/admin/users/add')}
          style={{ padding: '8px 16px', backgroundColor: '#ffd700', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Thêm người dùng
        </button>
      </div>

      <div className="orders-controls admin-controls">
        <div className="controls-left">
          <label>
            Hiển thị:
            <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>

        </div>
        <div className="controls-right">
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          // style={{ marginLeft: '10px', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', width: '250px' }}
          />
          <label>
            Sắp xếp theo:
            <select value={`${sortField}-${sortOrder}`} onChange={handleSortChange}>
              <option value="create_at-desc">Ngày tạo (Gần nhất)</option>
              <option value="create_at-asc">Ngày tạo (Cũ nhất)</option>
              <option value="name-asc">Tên (A-Z)</option>
              <option value="name-desc">Tên (Z-A)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="user-table">
        <table>
          <thead className="user-table-label">
            <tr>
              <th>STT</th>
              <th>Ảnh</th>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Role</th>
              <th>Địa chỉ</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Ngày tạo</th>
              <th>Ngày sửa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="11">Đang tải...</td></tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user._id} onClick={() => navigate(`/admin/users/${user._id}`)}>
                  <td>{(page - 1) * limit + idx + 1}</td>
                  <td className="user-img-cell">
                    <img
                      src={user.avatar || 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg'}
                      alt={user.name}
                      className="user-img"
                      style={{ borderRadius: '50%', width: '40px', height: '40px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://i.pinimg.com/736x/8f/1c/a2/8f1ca2029e2efceebd22fa05cca423d7.jpg';
                      }}
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number || '-'}</td>
                  <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: user.role === 'admin' ? '#f5222d' : '#52c41a', color: '#fff' }}>{user.role}</span></td>
                  <td>{user.address || '-'}</td>
                  <td>{user.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '-'}</td>
                  <td>{user.gender || '-'}</td>
                  <td>{new Date(user.create_at).toLocaleDateString('vi-VN')}</td>
                  <td>{user.update_at ? new Date(user.update_at).toLocaleDateString('vi-VN') : '---'}</td>
                  <td onClick={e => e.stopPropagation()} className='ad-user-edit-delete'>
                    <FontAwesomeIcon
                      icon={faPenToSquare}
                      className="icon edit"
                      onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                    />
                    {user.role !== 'admin' && ( // Prevent admin self-deletion easily from list
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="icon delete"
                        onClick={() => handleDelete(user._id)}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Trang trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>Trang sau</button>
        </div>
      )}

      {showConfirm && (
        <div className="ad-delprod-modal">
          <div className="ad-delprod-modal-content">
            <p>Bạn có chắc chắn muốn xóa người dùng này?</p>
            <button className="btn-ad-delprod" onClick={confirmDelete}>Xóa</button>
            <button className="btn-ad-cancelprod" onClick={() => setShowConfirm(false)}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}
