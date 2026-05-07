import React, { useState, useEffect } from 'react';
import './AdminTypes.css';
import { useCreateTypeMutation, useUpdateTypeMutation } from '../../../features/services/typeApi';
import Swal from 'sweetalert2';

export default function AdminTypeForm({ type, onClose, refetch }) {
    const [name, setName] = useState('');

    const [createType, { isLoading: isCreating }] = useCreateTypeMutation();
    const [updateType, { isLoading: isUpdating }] = useUpdateTypeMutation();

    useEffect(() => {
        if (type) {
            setName(type.type_name);
        }
    }, [type]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập tên phân loại', 'error');
            return;
        }

        try {
            if (type) {
                await updateType({ id: type._id, data: { type_name: name } }).unwrap();
                Swal.fire('Thành công', 'Đã cập nhật phân loại', 'success');
            } else {
                await createType({ type_name: name }).unwrap();
                Swal.fire('Thành công', 'Đã thêm phân loại mới', 'success');
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
                <h2>{type ? 'Chỉnh sửa phân loại' : 'Thêm phân loại mới'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên phân loại <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Nhập tên phân loại..."
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-save" disabled={isCreating || isUpdating}>
                            {type ? 'Cập nhật' : 'Thêm mới'}
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
