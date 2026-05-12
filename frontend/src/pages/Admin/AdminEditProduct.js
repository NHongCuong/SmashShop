import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
      const result = await Swal.fire({
        title: 'Thành công',
        text: "Cập nhật thành công! Bạn có muốn quay lại danh sách sản phẩm không?",
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#2b9d00',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Quay lại',
        cancelButtonText: 'Ở lại'
      });
      if (result.isConfirmed) {
        navigate('/admin/products');
      }

    } catch (err) {
      console.error("Lỗi khi cập nhật sản phẩm:", err);
      Swal.fire('Lỗi', "Không thể cập nhật sản phẩm. Kiểm tra thông tin hoặc kết nối mạng.", 'error');
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
