import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams  } from 'react-router-dom';
import { useGetProductsQuery, useGetAllBrandsQuery, useGetAllTypesQuery } from '../../../features/product/productApi';
import { useGetCategoriesQuery } from '../../../features/services/categoryApi';
import './AdminProductForm.css';

const AdminProductForm = ({ initialData = {}, onSubmit, isEdit = false, loading = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: products = [] } = useGetProductsQuery();

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: typesData } = useGetAllTypesQuery();

  const brands = brandsData || [];
  const types = typesData || [];

  const [formData, setFormData] = useState({
    prod_name: '',
    price: '',
    stock: '',
    quantity_sold: 0,
    description: '',
    category_id: '',
    brand_id: '',
    type_id: '',
    discount: '',
    images: [],
  });

  const [imagePreview, setImagePreview] = useState([]);

  useEffect(() => {
    if (isEdit && initialData) {
      const existingImages = (initialData.images || []).map(img =>
        typeof img === 'string' ? img : img.image
      );
  
      setFormData({
        ...initialData,
        category_id: initialData.category_id?._id,
        brand_id: initialData.brand_id?._id,
        type_id: initialData.type_id?._id,
        quantity_sold: Number(initialData.quantity_sold || 0),
        images: [],
      });
  
      setImagePreview(existingImages);
    }
  }, [initialData, isEdit]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    
    setImagePreview(previews);
    setFormData((prev) => ({ ...prev, images: files }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      quantity_sold: Number(formData.quantity_sold),
      discount: Number(formData.discount || 0),
    };
    if (!formData.prod_name || !formData.price || !formData.description || !formData.stock ||
        !formData.category_id || !formData.brand_id || !formData.type_id) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    onSubmit(formattedData); // Gửi dữ liệu ra ngoài
  };
  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>

      <label>Tên sản phẩm</label>
      <input name="prod_name" value={formData.prod_name} onChange={handleChange} required />

      <label>Giá gốc</label>
      <input name="price" type="number" value={formData.price} onChange={handleChange} required />

      <label>Số lượng trong kho</label>
      <input name="stock" type="number" value={formData.stock} onChange={handleChange} required />

      <label>Số lượng đã bán</label>
      <input name="quantity_sold" type="number" value={formData.quantity_sold} onChange={handleChange} />
      
      <label>Mô tả</label>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
        <label>
          <input
            type="radio"
            name="descMode"
            checked={formData.description !== 'Using AI'}
            onChange={() => setFormData(prev => ({ ...prev, description: '' }))}
          />
          Tự nhập
        </label>
        <label>
          <input
            type="radio"
            name="descMode"
            checked={formData.description === 'Using AI'}
            onChange={() => setFormData(prev => ({ ...prev, description: 'Using AI' }))}
          />
          Using AI
        </label>
      </div>

      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows="4"
      />
      
      <label>Danh mục</label>
      <select name="category_id" value={formData.category_id} onChange={handleChange} required>
        <option value="">Chọn danh mục</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>{category.category_name}</option>
        ))}
      </select>

      <label>Thương hiệu</label>
      <select name="brand_id" value={formData.brand_id} onChange={handleChange} required>
        <option value="">Chọn thương hiệu</option>
        {brands.map((brand) => (
          <option key={brand._id} value={brand._id}>{brand.brand_name}</option>
        ))}
      </select>

      <label>Loại sản phẩm</label>
      <select name="type_id" value={formData.type_id} onChange={handleChange} required>
        <option value="">Chọn loại</option>
        {types.map((type) => (
          <option key={type._id} value={type._id}>{type.type_name}</option>
        ))}
      </select>

      <label>Giảm giá (%)</label>
      <input name="discount" type="number" value={formData.discount} onChange={handleChange} />

      <label>Tải lên hình ảnh sản phẩm</label>
      <input type="file" multiple accept="image/*" onChange={handleImageChange} />
      <div className="image-preview">
        {imagePreview.map((src, idx) => (
          <img key={idx} src={src} alt={`img-${idx}`} />
        ))}
      </div>

      <div className="form-actions">
        <button type="submit">
           {loading ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </button>
        <button type="button" className="cancel" onClick={() => navigate("/admin/products")} disabled={loading}>Hủy</button>
      </div>
    </form>
  );
};

export default AdminProductForm;
