import React, { useState, useRef } from 'react';
import './AdminCategory.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import {
  useGetCategoriesAdminQuery,
  useDeleteCategoryMutation,
  useImportCategoriesMutation
} from '../../../features/services/categoryApi';
import AdminCategoryForm from './AdminCategoryForm';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function AdminCategory() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const fileInputRef = useRef(null);

  const { data: catData, isLoading, refetch } = useGetCategoriesAdminQuery({ page, limit, search, sort });
  const [deleteCategory] = useDeleteCategoryMutation();
  const [importCategories] = useImportCategoriesMutation();

  const categories = catData?.data || [];
  const totalPages = catData?.totalPages || 1;

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Danh mục này sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteCategory(id).unwrap();
        Swal.fire('Đã xóa!', 'Danh mục đã được xóa thành công.', 'success');
      } catch (err) {
        Swal.fire('Lỗi!', err.data?.message || 'Không thể xóa danh mục.', 'error');
      }
    }
  };

  const handleExportExcel = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/v1/category/export`;
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await importCategories(formData).unwrap();
      Swal.fire('Thành công!', 'Đã import danh mục từ Excel.', 'success');
      refetch();
    } catch (err) {
      Swal.fire('Lỗi!', err.data?.message || 'Import thất bại.', 'error');
    }
    e.target.value = ''; // Reset input
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditingCategory(cat);
    setShowForm(true);
  };

  return (
    <div className="admin-categories">
      <div className="admin-header-flex">
        <h1>Quản lý danh mục</h1>
        <div className="admin-header-btns">
          <button className="btn-add-cat" onClick={openAddForm}>
            <FontAwesomeIcon icon={faPlus} /> Thêm danh mục
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
        <div className="controls-left-category">
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
        <div className="controls-right-category">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
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
              <th>Ảnh</th>
              <th>Danh mục</th>
              <th>Ngày tạo</th>
              <th>Ngày sửa</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Không tìm thấy danh mục nào.</td></tr>
            ) : categories.map((cat, idx) => (
              <tr key={cat._id}>
                <td>{(page - 1) * limit + idx + 1}</td>
                <td>
                  <img src={cat.image || 'https://via.placeholder.com/50'} alt={cat.category_name} className="cat-img-preview" />
                </td>
                <td>{cat.category_name}</td>
                <td>{cat.create_at ? dayjs(cat.create_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                <td>{cat.update_at ? dayjs(cat.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                <td className="actions-cell">
                  <FontAwesomeIcon icon={faPenToSquare} className="icon-edit" onClick={() => openEditForm(cat)} />
                  <FontAwesomeIcon icon={faTrash} className="icon-delete" onClick={() => handleDelete(cat._id)} />
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
        <AdminCategoryForm
          category={editingCategory}
          onClose={() => setShowForm(false)}
          refetch={refetch}
        />
      )}
    </div>
  );
}
