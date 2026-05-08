import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminProductForm from './AdminProductForm/AdminProductForm';
import { useGetProductsQuery, useUpdateProductMutation } from '../../features/product/productApi';
import { useCreateProductImageMutation, useDeleteImagesByProductIdMutation } from '../../features/services/productImageApi';

const AdminEditProduct = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { data: products = [], isLoading, refetch } = useGetProductsQuery();
  const [updateProduct] = useUpdateProductMutation();
  const [uploadImage] = useCreateProductImageMutation();
  const [deleteImages] = useDeleteImagesByProductIdMutation();
  const initialData = products.find((p) => p._id === id);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (data) => {
    setLoading(true);
    try {
      const { images, remainingOldImages, ...productData } = data;

      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        formData.append(key, productData[key]);
      });

      // Thêm danh sách ảnh cũ còn lại
      if (remainingOldImages && remainingOldImages.length > 0) {
        remainingOldImages.forEach(url => {
          formData.append('remainingOldImages', url);
        });
      }

      // Thêm ảnh mới nếu có
      const newImages = images.filter((img) => img instanceof File);
      if (newImages.length > 0) {
        newImages.forEach(img => {
          formData.append('image', img);
        });
      }

      await updateProduct({ id, productData: formData }).unwrap();
      
      await refetch();
      if (window.confirm("Cập nhật thành công! Quay lại danh sách?")) {
        navigate('/admin/products');
      }

    } catch (err) {
      console.error("Lỗi khi cập nhật sản phẩm:", err);
      alert("Không thể cập nhật sản phẩm. Kiểm tra thông tin hoặc kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !initialData) return <div>Đang tải...</div>;

  return (
    <div className="admin-edit-product">
      <AdminProductForm
        initialData={initialData}
        onSubmit={handleUpdate}
        isEdit
        loading={loading}
      />
    </div>
  );
};

export default AdminEditProduct;
