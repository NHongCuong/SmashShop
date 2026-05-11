import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminProducts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faFileImport } from '@fortawesome/free-solid-svg-icons';
import { useGetAllProductsQuery, useDeactiveProductMutation, useGetProductsQuery, useImportProductsMutation } from '../../../features/product/productApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import * as XLSX from 'xlsx';

dayjs.extend(utc);

export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: queryData, refetch, isLoading } = useGetAllProductsQuery({ page, limit, sort: sortField, search: searchTerm });
  const products = queryData?.data || [];
  const totalPages = queryData?.totalPages || 1;

  const { data: allProductsData } = useGetProductsQuery();

  const [deactiveProduct] = useDeactiveProductMutation();
  const [importProducts, { isLoading: isImporting }] = useImportProductsMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (window.confirm("Bạn có muốn import sản phẩm từ file excel này không?")) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await importProducts(formData).unwrap();
        alert(res.message);
        if (res.errors && res.errors.length > 0) {
          console.error("Import Errors:", res.errors);
          alert("Có một số lỗi trong quá trình import, vui lòng kiểm tra console log.");
        }
        refetch();
      } catch (err) {
        console.error("Import failed:", err);
        alert(err?.data?.message || "Import thất bại.");
      }
    }
    // Reset input
    e.target.value = null;
  };

  const handleExportExcel = () => {
    if (!allProductsData || allProductsData.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = allProductsData.map((product, index) => ({
      "STT": index + 1,
      "Tên sản phẩm": product.prod_name,
      "product-url": product.product_url || "",
      "Danh mục": product.category_id?.category_name || "",
      "Thương hiệu": product.brand_id?.brand_name || "",
      "Giá": product.price,
      "Ngày tạo": product.create_at ? dayjs(product.create_at).utc().format('DD/MM/YYYY') : "",
      "Ngày sửa": product.update_at ? dayjs(product.update_at).utc().format('DD/MM/YYYY') : "",
      "Số lượng trong kho": product.stock,
      "Đã bán": product.quantity_sold,
      "Giảm giá": product.discount || 0,
      "Loại": product.type_id?.type_name || "",
      "Mã voucher": product.voucher_id?.voucher_name || "",
      "Màu sắc": product.colors?.map(c => c.color).join(', ') || "",
      "Kích cỡ": product.sizes?.map(s => s.size).join(', ') || "",
      "Ảnh": product.images?.[0]?.image?.[0] || "",
      "Mô tả": product.description || "",
    }));

    const totalPrice = allProductsData.reduce((sum, product) => sum + (product.price || 0), 0);
    dataToExport.push({
      "STT": "Tổng cộng",
      "Giá": totalPrice
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sản phẩm");
    XLSX.writeFile(workbook, "Danh_sach_san_pham.xlsx");
  };

  const handleDelete = (productId) => {
    setProductToDelete(productId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deactiveProduct(productToDelete).unwrap();
      alert("Đã xóa sản phẩm thành công!");
      refetch();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
    }
    setShowConfirm(false);
    setProductToDelete(null);
  };

  return (
    <div className="admin-products">
      <h1>Sản phẩm hiện có</h1>
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
          <button className="btn-export-excel" onClick={handleExportExcel} style={{ marginLeft: '14px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            <>
              <FontAwesomeIcon icon={faFileImport} style={{ marginRight: '5px' }} />
              Export Sản Phẩm
            </>
          </button> <br /><br />
          <button
            onClick={() => navigate('/admin/products/add')}
            style={{ padding: '8px 16px', backgroundColor: '#ffd700', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}
          >
            + Thêm sản phẩm
          </button>
          <input
            type="file"
            id="admin-import-excel"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-import-excel"
            onClick={() => document.getElementById('admin-import-excel').click()}
            disabled={isImporting}
            style={{ padding: '8px 16px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isImporting ? 'Đang import...' : (
              <>
                <FontAwesomeIcon icon={faFileImport} style={{ marginRight: '5px' }} />
                Import Sản Phẩm
              </>
            )}
          </button>

        </div>
        <div className="controls-right">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc danh mục..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          // style={{ marginLeft: '10px', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', width: '250px' }}
          />
          <label>
            Sắp xếp theo:
            <select value={sortField} onChange={(e) => { setSortField(e.target.value); setPage(1); }}>
              <option value="newest">Mới nhất</option>
              <option value="price_desc">Giá (Giảm dần)</option>
              <option value="price_asc">Giá (Tăng dần)</option>
              <option value="best_selling">Bán chạy</option>
            </select>
          </label>
        </div>
      </div>

      <div className="product-table">
        <table>
          <thead className="product-table-label">
            <tr>
              <th>STT</th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Giá</th>
              <th>Ngày tạo</th>
              <th>Ngày sửa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              <tr key={product.id} onClick={() => navigate(`/admin/products/${product.id}`)}>
                <td>{(page - 1) * limit + idx + 1}</td>
                <td className="prod-img-cell">
                  <img
                    src={`${product.images?.[0]?.image?.[0] || ''}`}
                    loading='lazy'
                    alt={product.prod_name}
                    className="product-img"
                  />
                </td>
                <td className="prod-name-cell">{product.prod_name}</td>
                <td>{product.category_id?.category_name || '---'}</td>
                <td>{product.brand_id?.brand_name || '---'}</td>
                <td>{product.price.toLocaleString('vi-VN')}₫</td>
                <td>{product.create_at ? dayjs(product.create_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                <td>{product.update_at ? dayjs(product.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                <td onClick={e => e.stopPropagation()} className='ad-product-edit-delete'>
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    className="icon edit"
                    onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                  />
                  <FontAwesomeIcon
                    icon={faTrash}
                    className="icon delete"
                    onClick={() => handleDelete(product.id)}
                  />
                </td>
              </tr>
            ))}
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
            <p>Bạn có chắc chắn muốn xóa sản phẩm này?</p>
            <button className="btn-ad-delprod" onClick={confirmDelete}>Xóa</button>
            <button className="btn-ad-cancelprod" onClick={() => setShowConfirm(false)}>Hủy</button>
          </div>
        </div>
      )}
    </div>
  );
}