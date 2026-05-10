import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPostByIdQuery, useCreatePostMutation, useUpdatePostMutation } from '../../../features/post/postApi';
import { useGetCategoriesQuery } from '../../../features/services/categoryApi';
import { useGetAdminUsersQuery } from '../../../features/user/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import './AdminPostForm.css';

const AdminPostForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const { data: postData, isLoading: postLoading } = useGetPostByIdQuery(id, { skip: !isEdit });
    const { data: categories } = useGetCategoriesQuery();
    const { data: userData } = useGetAdminUsersQuery({ limit: 100 });
    
    // Filter admin users
    const adminUsers = userData?.data?.filter(u => u.role === 'admin') || [];

    const [createPost, { isLoading: creating }] = useCreatePostMutation();
    const [updatePost, { isLoading: updating }] = useUpdatePostMutation();

    const [formData, setFormData] = useState({
        title: '',
        category_id: '',
        user_id: '',
        images: [''],
        total_content: [{ headling: '', content: '' }]
    });

    useEffect(() => {
        if (isEdit && postData) {
            setFormData({
                title: postData.title || '',
                category_id: postData.category_id?._id || '',
                user_id: postData.user_id?._id || '',
                images: postData.images?.length > 0 ? [...postData.images] : [''],
                total_content: postData.total_content?.length > 0 
                  ? postData.total_content.map(c => ({ headling: c.headling || '', content: c.content || '' }))
                  : [{ headling: '', content: '' }]
            });
        }
    }, [isEdit, postData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContentChange = (index, field, value) => {
        const newContent = [...formData.total_content];
        newContent[index][field] = value;
        setFormData(prev => ({ ...prev, total_content: newContent }));
    };

    const addContentRow = () => {
        setFormData(prev => ({
            ...prev,
            total_content: [...prev.total_content, { headling: '', content: '' }]
        }));
    };

    const removeContentRow = (index) => {
        if (formData.total_content.length === 1) return;
        const newContent = formData.total_content.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, total_content: newContent }));
    };

    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const addImageField = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
    };

    const removeImageField = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category_id || !formData.user_id) {
            Swal.fire('Lỗi', 'Vui lòng chọn danh mục và tác giả', 'error');
            return;
        }

        // Filter out empty images and content rows
        const cleanedData = {
            ...formData,
            images: formData.images.filter(img => img.trim() !== ''),
            total_content: formData.total_content.filter(c => c.headling.trim() !== '' || c.content.trim() !== '')
        };

        try {
            if (isEdit) {
                await updatePost({ id, ...cleanedData }).unwrap();
                Swal.fire('Thành công', 'Cập nhật bài viết thành công!', 'success');
            } else {
                await createPost(cleanedData).unwrap();
                Swal.fire('Thành công', 'Thêm bài viết mới thành công!', 'success');
            }
            navigate('/admin/posts');
        } catch (err) {
            console.error('Submit error:', err);
            Swal.fire('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
        }
    };

    if (isEdit && postLoading) return <div className="admin-loading">Đang tải dữ liệu bài viết...</div>;

    return (
        <div className="admin-post-form-container">
            <div className="form-header">
                <button className="btn-back" onClick={() => navigate('/admin/posts')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                </button>
                <h2>{isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="admin-post-form">
                <div className="form-section">
                    <label>Tiêu đề bài viết</label>
                    <input 
                        type="text" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="Nhập tiêu đề..."
                    />
                </div>

                <div className="form-row">
                    <div className="form-section">
                        <label>Danh mục</label>
                        <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                            <option value="">-- Chọn danh mục --</option>
                            {categories?.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-section">
                        <label>Tác giả (Admin)</label>
                        <select name="user_id" value={formData.user_id} onChange={handleInputChange} required>
                            <option value="">-- Chọn tác giả --</option>
                            {adminUsers.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <label>Hình ảnh (URLs)</label>
                    {formData.images.map((img, idx) => (
                        <div key={idx} className="image-input-row">
                            <input 
                                type="text" 
                                value={img} 
                                onChange={(e) => handleImageChange(idx, e.target.value)} 
                                placeholder="http://..."
                            />
                            {formData.images.length > 1 && (
                                <button type="button" className="btn-remove" onClick={() => removeImageField(idx)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn-add-more" onClick={addImageField}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm ảnh
                    </button>
                </div>

                <div className="form-section contents-section">
                    <label>Nội dung chi tiết</label>
                    {formData.total_content.map((content, idx) => (
                        <div key={idx} className="content-block">
                            <div className="content-header">
                                <span>Phần {idx + 1}</span>
                                {formData.total_content.length > 1 && (
                                    <button type="button" className="btn-remove-content" onClick={() => removeContentRow(idx)}>
                                        <FontAwesomeIcon icon={faTrash} /> Xóa phần này
                                    </button>
                                )}
                            </div>
                            <input 
                                type="text" 
                                placeholder="Heading (Mục lục)..." 
                                value={content.headling} 
                                onChange={(e) => handleContentChange(idx, 'headling', e.target.value)}
                            />
                            <textarea 
                                placeholder="Nội dung chi tiết..." 
                                rows="6" 
                                value={content.content} 
                                onChange={(e) => handleContentChange(idx, 'content', e.target.value)}
                            />
                        </div>
                    ))}
                    <button type="button" className="btn-add-content" onClick={addContentRow}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm đoạn nội dung (Heading & Content)
                    </button>
                </div>

                <button type="submit" className="btn-submit" disabled={creating || updating}>
                    <FontAwesomeIcon icon={faSave} /> {isEdit ? 'Cập nhật bài viết' : 'Lưu bài viết'}
                </button>
            </form>
        </div>
    );
};

export default AdminPostForm;
