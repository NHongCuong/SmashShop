import React from 'react';
import { useGetProductsQuery } from '../../../features/product/productApi';
import { useParams } from 'react-router-dom';
import './AdminProductDetail.css';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const AdminProductDetail = () => {
  const { id } = useParams();
  const { data: products = [], isLoading } = useGetProductsQuery();

  if (isLoading) return <div>Đang tải...</div>;

  const product = products.find((p) => p._id === id);
  if (!product) return <div>Không tìm thấy sản phẩm</div>;

  const {
    prod_name,
    price,
    stock,
    quantity_sold,
    description,
    category_id,
    brand_id,
    type_id,
    discount,
    voucher_id,
    images
  } = product;

  const primaryImage = images?.[0]?.image?.[0];

  const handleExportExcel = () => {
    if (!products || products.length === 0) {
      Swal.fire('Thông báo', "Không có dữ liệu để xuất!", 'info');
      return;
    }

    const dataToExport = products.map((product, index) => ({
      "STT": index + 1,
      "Tên sản phẩm": product.prod_name,
      "product-url": product.product_url || "",
      "Danh mục": product.category_id?.category_name || "",
      "Thương hiệu": product.brand_id?.brand_name || "",
      "Giá": product.price,
      "Ngày tạo": product.create_at ? dayjs(product.create_at).utc().format('DD/MM/YYYY HH:mm:ss') : "",
      "Ngày sửa": product.update_at ? dayjs(product.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : "",
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

    const totalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
    dataToExport.push({
      "STT": "Tổng cộng",
      "Giá": totalPrice
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sản phẩm");
    XLSX.writeFile(workbook, "Danh_sach_san_pham.xlsx");
  };

  return (
    <div className="admin-product-detail">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Thông tin sản phẩm</h1>
        <button className="btn-export-excel" onClick={handleExportExcel} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          <>
            <FontAwesomeIcon icon={faFileImport} style={{ marginRight: '5px' }} />
            Export Sản Phẩm
          </>
        </button>
      </div>
      <div className="product-detail-container">
        <div className="admin-product-image">
          {primaryImage ? (
            <img src={primaryImage} alt={prod_name} />
          ) : (
            <div className="no-image">Không có ảnh</div>
          )}
        </div>
        <div className="product-info">
          <p><strong>ID:</strong> {product.prod_id}</p>
          <p className="prod-name"><strong>Tên sản phẩm:</strong> {prod_name}</p>
          <p><strong>URL:</strong> {product.product_url || 'Chưa có'}</p>
          <p className="price"><strong>Giá:</strong> {price.toLocaleString()} VND</p>
          <p><strong>Số lượng trong kho:</strong> {stock}</p>
          <p><strong>Đã bán:</strong> {quantity_sold}</p>
          <p><strong>Giảm giá:</strong> {discount}%</p>
          <p><strong>Loại:</strong> {type_id?.type_name}</p>
          <p><strong>Danh mục:</strong> {category_id?.category_name}</p>
          <p><strong>Thương hiệu:</strong> {brand_id?.brand_name}</p>
          <p><strong>Màu sắc:</strong> {product.colors?.map(c => c.color).join(', ') || 'N/A'}</p>
          <p><strong>Kích cỡ:</strong> {product.sizes?.map(s => s.size).join(', ') || 'N/A'}</p>
          <p><strong>Mã voucher:</strong> {voucher_id?.voucher_name || 'Không có'}</p>
        </div>
      </div>
      <div className="ad-product-des details">
        <p><strong>Mô tả:</strong></p>
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>
    </div>
  );
};

export default AdminProductDetail;
