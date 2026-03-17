import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminProducts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useGetProductsQuery, useDeactiveProductMutation } from '../../../features/product/productApi';

export default function AdminProducts() {
  const {data: products = [], refetch, isLoading} = useGetProductsQuery();
  const [deactiveProduct] = useDeactiveProductMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();
  

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
      <div className="product-table">
        <table>
          <thead className="product-table-label">
            <tr>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Giá</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} onClick={() => navigate(`/admin/products/${product.id}`)}>
                <td className="prod-img-cell"><img src={`${product.images.filter(prod => prod.is_primary_image)[0]?.image}`} loading='lazy' alt={product.prod_name} className="product-img" /></td>
                <td className="prod-name-cell">{product.prod_name}</td>
                <td>{product.category_id.category_name}</td>
                <td>{product.brand_id.brand_name}</td>
                <td>{product.price.toLocaleString('vi-VN')}₫</td>
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