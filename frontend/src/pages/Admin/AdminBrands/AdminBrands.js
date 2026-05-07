import React, { useState, useRef } from 'react';
import './AdminBrands.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faPlus, faFileExport, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { 
  useGetBrandsAdminQuery, 
  useDeleteBrandMutation,
  useImportBrandsMutation 
} from '../../../features/services/brandApi';
import AdminBrandForm from './AdminBrandForm';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function AdminBrands() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const fileInputRef = useRef(null);

  const { data: brandData, isLoading, refetch } = useGetBrandsAdminQuery({ page, limit, search, sort });
  const [deleteBrand] = useDeleteBrandMutation();
  const [importBrands] = useImportBrandsMutation();

  const brands = brandData?.data || [];
  const totalPages = brandData?.totalPages || 1;

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Thương hiệu này sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteBrand(id).unwrap();
        Swal.fire('Đã xóa!', 'Thương hiệu đã được xóa thành công.', 'success');
      } catch (err) {
        Swal.fire('Lỗi!', err.data?.message || 'Không thể xóa thương hiệu.', 'error');
      }
    }
  };

  const handleExportExcel = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/v1/brand/export`;
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      Swal.fire({ title: 'Đang xử lý...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await importBrands(formData).unwrap();
      Swal.fire('Thành công!', 'Đã import thương hiệu từ Excel.', 'success');
      refetch();
    } catch (err) {
      Swal.fire('Lỗi!', err.data?.message || 'Import thất bại.', 'error');
    }
    e.target.value = ''; // Reset input
  };

  const openAddForm = () => {
    setEditingBrand(null);
    setShowForm(true);
  };

  const openEditForm = (brand) => {
    setEditingBrand(brand);
    setShowForm(true);
  };

  return (
    <div className="admin-brands">
      <div className="admin-header-flex">
        <h1>Quản lý thương hiệu</h1>
        <div className="admin-header-btns">
            <button className="btn-add-brand" onClick={openAddForm}>
                <FontAwesomeIcon icon={faPlus} /> Thêm thương hiệu
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
        <div className="controls-left-brand">
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
        <div className="controls-right-brand">
          <input
            type="text"
            placeholder="Tìm kiếm thương hiệu..."
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
              <th>Thương hiệu</th>
              <th>Ngày tạo</th>
              <th>Ngày sửa</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{textAlign:'center'}}>Đang tải...</td></tr>
            ) : brands.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center'}}>Không tìm thấy thương hiệu nào.</td></tr>
            ) : brands.map((brand, idx) => (
              <tr key={brand._id}>
                <td>{(page - 1) * limit + idx + 1}</td>
                <td>{brand.brand_name}</td>
                <td>{brand.create_at ? dayjs(brand.create_at).utc().format('DD/MM/YYYY') : '---'}</td>
                <td>{brand.update_at ? dayjs(brand.update_at).utc().format('DD/MM/YYYY') : '---'}</td>
                <td className="actions-cell">
                  <FontAwesomeIcon icon={faPenToSquare} className="icon-edit" onClick={() => openEditForm(brand)} />
                  <FontAwesomeIcon icon={faTrash} className="icon-delete" onClick={() => handleDelete(brand._id)} />
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
        <AdminBrandForm 
          brand={editingBrand} 
          onClose={() => setShowForm(false)} 
          refetch={refetch}
        />
      )}
    </div>
  );
}
