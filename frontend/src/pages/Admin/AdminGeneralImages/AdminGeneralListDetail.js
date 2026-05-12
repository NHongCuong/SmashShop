import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetGeneralImageByIdQuery } from '../../../features/services/generalImageApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import './AdminGeneralListDetail.css';

dayjs.extend(utc);

export default function AdminGeneralListDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: imageData, isLoading } = useGetGeneralImageByIdQuery(id);

    if (isLoading) return <div className="loading">Đang tải chi tiết...</div>;
    if (!imageData?.success) return <div className="error">Không tìm thấy thông tin ảnh.</div>;

    const item = imageData.data;

    return (
        <div className="admin-detail-container">
            <div className="detail-card">
                <div className="detail-header">
                    <h3>Chi tiết Ảnh Chung</h3>
                    <button className="back-btn" onClick={() => navigate('/admin/general-images')}>Quay lại</button>
                </div>
                
                <div className="detail-content">
                    <div className="detail-row">
                        <label>Tên ảnh:</label>
                        <span>{item.image_name}</span>
                    </div>

                    <div className="detail-row">
                        <label>Đường dẫn ảnh (Url_Image):</label>
                        <div className="url-list">
                            {item.image?.map((url, i) => (
                                <div key={i} className="url-item">
                                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="detail-row">
                        <label>Ngày tạo:</label>
                        <span>{dayjs(item.create_at).utc().format('DD/MM/YYYY HH:mm:ss')}</span>
                    </div>

                    {item.updated_at && (
                        <div className="detail-row">
                            <label>Ngày sửa:</label>
                            <span>{dayjs(item.updated_at).utc().format('DD/MM/YYYY HH:mm:ss')}</span>
                        </div>
                    )}

                    <div className="detail-row images-row">
                        <label>Ảnh hiển thị:</label>
                        <div className="image-grid">
                            {item.image?.map((img, i) => (
                                <div key={i} className="image-item">
                                    <img src={img} alt={`${item.image_name} ${i + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="detail-actions">
                    <button className="edit-detail-btn" onClick={() => navigate(`/admin/general-images/edit/${item._id}`)}>
                        Chỉnh sửa thông tin
                    </button>
                </div>
            </div>
        </div>
    );
}
