import React, { useState, useRef } from 'react';
import './AdminTypes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import {
  useGetTypesAdminQuery,
  useDeleteTypeMutation,
  useImportTypesMutation
} from '../../../features/services/typeApi';
import AdminTypeForm from './AdminTypeForm';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function AdminTypes() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const fileInputRef = useRef(null);

  const { data: typeData, isLoading, refetch } = useGetTypesAdminQuery({ page, limit, search, sort });
  const [deleteType] = useDeleteTypeMutation();
  const [importTypes] = useImportTypesMutation();

  const types = typeData?.data || [];
  const totalPages = typeData?.totalPages || 1;

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Phân loại này sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteType(id).unwrap();
        Swal.fire('Đã xóa!', 'Phân loại đã được xóa thành công.', 'success');
      } catch (err) {
        Swal.fire('Lỗi!', err.data?.message || 'Không thể xóa phân loại.', 'error');
      }
    }
  };

  const handleExportExcel = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/v1/type/export`;
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await importTypes(formData).unwrap();
      Swal.fire('Thành công!', 'Đã import phân loại từ Excel.', 'success');
      refetch();
    } catch (err) {
      Swal.fire('Lỗi!', err.data?.message || 'Import thất bại.', 'error');
    }
    e.target.value = ''; // Reset input
  };

  const openAddForm = () => {
    setEditingType(null);
    setShowForm(true);
  };

  const openEditForm = (type) => {
    setEditingType(type);
    setShowForm(true);
  };

  return (
    <div className="admin-types">
      <div className="admin-header-flex">
        <h1>Quản lý phân loại</h1>
        <div className="admin-header-btns">
          <button className="btn-add-type" onClick={openAddForm}>
            <FontAwesomeIcon icon={faPlus} /> Thêm phân loại
          </button>
          <button className="btn-export-excel" onClick={handleExportExcel}>
            <FontAwesomeIcon icon={faFileExport} /> Xuất Excel
          </button>
          <button className="btn-import-excel" onClick={() => fileInputRef.current.click()}>
            <FontAwesomeIcon icon={faFileImport} /> Import Excel
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
          />
        </div>
      </div>

      <div className="admin-controls-wrapper">
        <div className="controls-left-type">
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
        <div className="controls-right-type">
          <input
            type="text"
            placeholder="Tìm kiếm phân loại..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="search-input"
          />
          <label>
            Sắp xếp:
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Phân loại</th>
              <th>Ngày tạo</th>
              <th>Ngày sửa</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : types.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Không tìm thấy phân loại nào.</td></tr>
            ) : types.map((type, idx) => (
              <tr key={type._id}>
                <td>{(page - 1) * limit + idx + 1}</td>
                <td>{type.type_name}</td>
                <td>{type.create_at ? dayjs(type.create_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                <td>{type.update_at ? dayjs(type.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                <td className="actions-cell">
                  <FontAwesomeIcon icon={faPenToSquare} className="icon-edit" onClick={() => openEditForm(type)} />
                  <FontAwesomeIcon icon={faTrash} className="icon-delete" onClick={() => handleDelete(type._id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
        </div>
      )}

      {showForm && (
        <AdminTypeForm
          type={editingType}
          onClose={() => setShowForm(false)}
          refetch={refetch}
        />
      )}
    </div>
  );
}
