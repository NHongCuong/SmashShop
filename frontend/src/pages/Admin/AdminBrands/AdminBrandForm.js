import React, { useState, useEffect } from 'react';
import './AdminBrands.css';
import { useCreateBrandMutation, useUpdateBrandMutation } from '../../../features/services/brandApi';
import Swal from 'sweetalert2';

export default function AdminBrandForm({ brand, onClose, refetch }) {
    const [name, setName] = useState('');

    const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
    const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();

    useEffect(() => {
        if (brand) {
            setName(brand.brand_name);
        }
    }, [brand]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập tên thương hiệu', 'error');
            return;
        }

        try {
            if (brand) {
                await updateBrand({ id: brand._id, data: { brand_name: name } }).unwrap();
                Swal.fire('Thành công', 'Đã cập nhật thương hiệu', 'success');
            } else {
                await createBrand({ brand_name: name }).unwrap();
                Swal.fire('Thành công', 'Đã thêm thương hiệu mới', 'success');
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
                <h2>{brand ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên thương hiệu <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Nhập tên thương hiệu..."
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-save" disabled={isCreating || isUpdating}>
                            {brand ? 'Cập nhật' : 'Thêm mới'}
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
