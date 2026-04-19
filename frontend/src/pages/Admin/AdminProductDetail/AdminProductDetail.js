import React from 'react';
import { useGetProductsQuery } from '../../../features/product/productApi';
import { useParams } from 'react-router-dom';
import './AdminProductDetail.css';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';

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
    images
  } = product;

  const primaryImage = images.find(img => img.is_primary_image)?.image;

  const handleExportExcel = () => {
    if (!products || products.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = products.map((product, index) => ({
      "STT": index + 1,
      "Ảnh": product.images?.filter(img => img.is_primary_image)[0]?.image || "",
      "Tên sản phẩm": product.prod_name,
      "Danh mục": product.category_id?.category_name || "",
      "Thương hiệu": product.brand_id?.brand_name || "",
      "Giá": product.price,
      "Số lượng trong kho": product.stock,
      "Đã bán": product.quantity_sold,
      "Giảm giá": product.discount || 0,
      "Loại": product.type_id?.type_name || "",
      "Thương hiệu ": product.brand_id?.brand_name || "",
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
        <button className="btn-export-excel" onClick={handleExportExcel} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Download file excel tất cả sản phẩm
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
          <p className="price"><strong>Giá:</strong> {price.toLocaleString()} VND</p>
          <p><strong>Số lượng trong kho:</strong> {stock}</p>
          <p><strong>Đã bán:</strong> {quantity_sold}</p>
          <p><strong>Giảm giá:</strong> {discount}%</p>
          <p><strong>Loại:</strong> {type_id?.type_name}</p>
          <p><strong>Danh mục:</strong> {category_id?.category_name}</p>
          <p><strong>Thương hiệu:</strong> {brand_id?.brand_name}</p>
          
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
