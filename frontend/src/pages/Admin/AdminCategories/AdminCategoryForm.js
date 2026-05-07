import React, { useState, useEffect } from 'react';
import './AdminCategory.css';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '../../../features/services/categoryApi';
import Swal from 'sweetalert2';

export default function AdminCategoryForm({ category, onClose, refetch }) {
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [preview, setPreview] = useState('');

    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    useEffect(() => {
        if (category) {
            setName(category.category_name);
            setImageUrl(category.image || '');
            setPreview(category.image || '');
        }
    }, [category]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
            setImageUrl(''); // Clear URL if file is selected
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập tên danh mục', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('category_name', name);
        if (imageFile) {
            formData.append('image', imageFile);
        } else if (imageUrl) {
            formData.append('image', imageUrl);
        }

        try {
            if (category) {
                await updateCategory({ id: category._id, formData }).unwrap();
                Swal.fire('Thành công', 'Đã cập nhật danh mục', 'success');
            } else {
                await createCategory(formData).unwrap();
                Swal.fire('Thành công', 'Đã thêm danh mục mới', 'success');
            }
            refetch();
            onClose();
        } catch (err) {
            Swal.fire('Lỗi', err.data?.message || 'Có lỗi xảy ra', 'error');
        }
    };

    return (
        <div className="admin-modal-overlay">
            <div className="admin-modal-content">
                <h2>{category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên danh mục <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Nhập tên danh mục..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Ảnh danh mục (Chọn file hoặc nhập URL)</label>
                        <div className="image-input-options">
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                            <div className="divider"><span>HOẶC</span></div>
                            <input 
                                type="text" 
                                value={imageUrl} 
                                onChange={(e) => {
                                    setImageUrl(e.target.value);
                                    setPreview(e.target.value);
                                    setImageFile(null);
                                }} 
                                placeholder="Nhập URL ảnh..."
                            />
                        </div>
                    </div>

                    {preview && (
                        <div className="image-preview-box">
                            <p>Xem trước:</p>
                            <img src={preview} alt="Preview" />
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="submit" className="btn-save" disabled={isCreating || isUpdating}>
                            {category ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
