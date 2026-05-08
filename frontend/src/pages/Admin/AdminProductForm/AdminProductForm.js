import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams  } from 'react-router-dom';
import { useGetProductsQuery, useGetAllBrandsQuery, useGetAllTypesQuery, useImportProductsMutation } from '../../../features/product/productApi';
import { useGetCategoriesQuery } from '../../../features/services/categoryApi';
import { useGetVouchersQuery } from '../../../features/services/voucherApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './AdminProductForm.css';

const AdminProductForm = ({ initialData = {}, onSubmit, isEdit = false, loading = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: products = [] } = useGetProductsQuery();

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: typesData } = useGetAllTypesQuery();
  const { data: vouchersData } = useGetVouchersQuery();

  const brands = brandsData || [];
  const vouchers = vouchersData || [];
  const types = typesData || [];
  const [importProducts, { isLoading: isImporting }] = useImportProductsMutation();

  const [formData, setFormData] = useState({
    prod_name: '',
    price: '',
    stock: '',
    quantity_sold: 0,
    description: '',
    category_id: '',
    brand_id: '',
    type_id: '',
    voucher_id: '',
    discount: '',
    images: [],
  });

  const [imagePreview, setImagePreview] = useState([]);

  useEffect(() => {
    if (isEdit && initialData) {
      // Flatten arrays if necessary, as our new model stores image: [String]
      const existingImages = (initialData.images || []).flatMap(img =>
        Array.isArray(img.image) ? img.image : [img.image]
      );
  
      setFormData({
        ...initialData,
        category_id: initialData.category_id?._id,
        brand_id: initialData.brand_id?._id,
        type_id: initialData.type_id?._id,
        voucher_id: initialData.voucher_id?._id || '',
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
    // Lưu trữ files gốc để upload
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    
    // Tạo preview cho các file mới
    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      file: file
    }));
    setImagePreview((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const removedItem = imagePreview[index];
    
    // Nếu là file mới upload (có thuộc tính file), cần xóa trong formData
    if (removedItem.file) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(f => f !== removedItem.file)
      }));
    }
    
    // Nếu là ảnh cũ trên server (item là string hoặc không có .file), 
    // chúng ta chỉ cần xóa khỏi imagePreview. 
    // Khi submit, chúng ta sẽ lấy những cái còn lại trong imagePreview mà là string.
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Lấy danh sách URL ảnh cũ còn lại
    const remainingOldImages = imagePreview
      .filter(item => typeof item === 'string')
      .map(url => url);

    const formattedData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      quantity_sold: Number(formData.quantity_sold),
      discount: Number(formData.discount || 0),
      remainingOldImages: remainingOldImages // Truyền danh sách ảnh cũ chưa bị xóa
    };
    if (!formData.prod_name || !formData.price || !formData.description || !formData.stock ||
        !formData.category_id || !formData.brand_id || !formData.type_id) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    onSubmit(formattedData); // Gửi dữ liệu ra ngoài
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (window.confirm("Bạn có muốn import sản phẩm từ file excel này không?")) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await importProducts(formData).unwrap();
        alert(res.message);
        if (res.errors) {
            console.error("Import Errors:", res.errors);
            alert("Có một số lỗi trong quá trình import, vui lòng kiểm tra console log.");
        }
        navigate('/admin/products');
      } catch (err) {
        console.error("Import failed:", err);
        alert(err?.data?.message || "Import thất bại.");
      }
    }
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

      <label>Khuyến mãi</label>
      <select name="voucher_id" value={formData.voucher_id} onChange={handleChange}>
        <option value="">Không có khuyến mãi</option>
        {vouchers.map((voucher) => (
          <option key={voucher._id} value={voucher._id}>{voucher.voucher_name}</option>
        ))}
      </select>

      <label>Giảm giá (%)</label>
      <input name="discount" type="number" value={formData.discount} onChange={handleChange} />

      <label>Tải lên hình ảnh sản phẩm</label>
      <input type="file" multiple accept="image/*" onChange={handleImageChange} />
      <div className="image-preview">
        {imagePreview.map((item, idx) => (
          <div key={idx} className="preview-item">
            <img src={typeof item === 'string' ? item : item.url} alt={`img-${idx}`} />
            <button type="button" className="remove-img-btn" onClick={() => removeImage(idx)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button type="submit">
           {loading ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </button>
        {!isEdit && (
          <>
            <input
              type="file"
              id="import-excel"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="import-btn"
              onClick={() => document.getElementById('import-excel').click()}
              disabled={isImporting}
            >
              {isImporting ? 'Đang import...' : 'Import Sản phẩm (Excel)'}
            </button>
          </>
        )}
        <button type="button" className="cancel" onClick={() => navigate("/admin/products")} disabled={loading}>Hủy</button>
      </div>
    </form>
  );
};

export default AdminProductForm;
