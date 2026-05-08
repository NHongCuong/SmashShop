import React from 'react';
import AdminProductForm from './AdminProductForm/AdminProductForm';
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation } from '../../features/product/productApi';
import { useCreateProductImageMutation } from '../../features/services/productImageApi';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const [createProduct] = useCreateProductMutation();
  const { refetch } = useGetProductsQuery();
  const [loading, setLoading] = useState(false);

  const handleAdd = async (data) => {
    setLoading(true);
    try {
      const { images, ...productData } = data;
      
      const formData = new FormData();
      // Append product info
      Object.keys(productData).forEach(key => {
        formData.append(key, productData[key]);
      });
      
      // Append images
      if (images && images.length > 0) {
        images.forEach(img => {
          formData.append('image', img); // field name 'image' matches backend parser.array('image', 10)
        });
      }

      await createProduct(formData).unwrap();
  
      await refetch();
      if (window.confirm("Thêm sản phẩm thành công! Bấm OK để quay lại trang quản lý.")) {
        navigate('/admin/products');
      }
  
    } catch (error) {
      console.error("Lỗi khi thêm sản phẩm:", error);
      const msg = error?.data?.message || "Thêm sản phẩm thất bại. Vui lòng kiểm tra lại thông tin.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-add-product">
      <AdminProductForm onSubmit={handleAdd} loading={loading} />
    </div>
  );
};

export default AdminAddProduct;
