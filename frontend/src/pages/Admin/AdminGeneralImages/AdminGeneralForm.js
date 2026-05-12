import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    useCreateGeneralImageMutation,
    useUpdateGeneralImageMutation,
    useGetGeneralImageByIdQuery
} from '../../../features/services/generalImageApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';
import './AdminGeneralForm.css';
import Swal from 'sweetalert2';

export default function AdminGeneralForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [imageName, setImageName] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [oldImages, setOldImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    const { data: imageData, isLoading: isFetching } = useGetGeneralImageByIdQuery(id, { skip: !isEdit });
    const [createImage, { isLoading: isCreating }] = useCreateGeneralImageMutation();
    const [updateImage, { isLoading: isUpdating }] = useUpdateGeneralImageMutation();

    useEffect(() => {
        if (imageData?.success) {
            setImageName(imageData.data.image_name);
            setOldImages(imageData.data.image || []);
        }
    }, [imageData]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeOldImage = (index) => {
        setOldImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!imageName) return Swal.fire('Thông báo', "Vui lòng nhập tên ảnh", 'info');
        
        const formData = new FormData();
        formData.append('image_name', imageName);
        
        selectedFiles.forEach(file => {
            formData.append('image', file);
        });

        if (isEdit) {
            oldImages.forEach(img => {
                formData.append('remainingOldImages', img);
            });

            try {
                await updateImage({ id, formData }).unwrap();
                Swal.fire('Thành công', "Cập nhật thành công!", 'success');
                navigate('/admin/general-images');
            } catch (err) {
                Swal.fire('Thất bại', "Cập nhật thất bại!", 'error');
            }
        } else {
            if(selectedFiles.length === 0) return Swal.fire('Thông báo', "Vui lòng chọn ít nhất 1 ảnh", 'info');
            try {
                await createImage(formData).unwrap();
                Swal.fire('Thành công', "Thêm thành công!", 'success');
                navigate('/admin/general-images');
            } catch (err) {
                Swal.fire('Thất bại', "Thêm thất bại!", 'error');
            }
        }
    };

    if (isFetching) return <div className="loading-overlay">Đang tải dữ liệu...</div>;

    return (
        <div className="admin-form-container">
            <div className="form-card">
                <h3>{isEdit ? 'Chỉnh sửa' : 'Thêm'} Ảnh Chung</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label>Tên ảnh</label>
                        <input 
                            type="text" 
                            className="form-input"
                            value={imageName} 
                            onChange={(e) => setImageName(e.target.value)} 
                            required 
                            placeholder="Nhập tên ảnh (VD: Logo, Slide 1...)"
                        />
                    </div>

                    <div className="form-section">
                        <label>Tải lên hình ảnh</label>
                        <label className="upload-box">
                            <FontAwesomeIcon icon={faCloudUploadAlt} size="2x" />
                            <span>Chọn nhiều ảnh</span>
                            <input type="file" multiple hidden onChange={handleFileChange} accept="image/*" />
                        </label>
                        
                        <div className="image-preview-grid">
                            {/* Old Images */}
                            {oldImages.map((img, i) => (
                                <div key={`old-${i}`} className="preview-card">
                                    <img src={img} alt="" />
                                    <span className="badge old">Cũ</span>
                                    <button type="button" className="delete-btn" onClick={() => removeOldImage(i)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            ))}
                            {/* New Previews */}
                            {previews.map((url, i) => (
                                <div key={`new-${i}`} className="preview-card">
                                    <img src={url} alt="" />
                                    <span className="badge new">Mới</span>
                                    <button type="button" className="delete-btn" onClick={() => removeNewImage(i)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-buttons">
                        <button type="submit" disabled={isCreating || isUpdating} className="btn-primary">
                            {isCreating || isUpdating ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm mới')}
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => navigate('/admin/general-images')}>Quay lại</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
