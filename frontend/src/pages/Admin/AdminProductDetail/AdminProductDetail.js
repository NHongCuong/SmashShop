import React from 'react';
import { useGetProductsQuery } from '../../../features/product/productApi';
import { useParams } from 'react-router-dom';
import './AdminProductDetail.css';
import ReactMarkdown from 'react-markdown';
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

  return (
    <div className="admin-product-detail">
      <h1>Thông tin sản phẩm</h1>
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
