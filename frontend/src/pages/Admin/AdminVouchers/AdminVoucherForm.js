import React, { useState, useEffect } from 'react';
import './AdminVouchers.css';
import { useCreateVoucherMutation, useUpdateVoucherMutation } from '../../../features/services/voucherApi';
import Swal from 'sweetalert2';

export default function AdminVoucherForm({ voucher, onClose, refetch }) {
    const [name, setName] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');

    const [createVoucher, { isLoading: isCreating }] = useCreateVoucherMutation();
    const [updateVoucher, { isLoading: isUpdating }] = useUpdateVoucherMutation();

    useEffect(() => {
        if (voucher) {
            setName(voucher.voucher_name);
            setDiscountPercent(voucher.discount_percent);
        }
    }, [voucher]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire('Lỗi', 'Vui lòng nhập tên khuyến mãi', 'error');
            return;
        }

        const discount = Number(discountPercent);
        if (isNaN(discount) || discount < 0 || discount > 100) {
            Swal.fire('Lỗi', '% giảm giá phải từ 0 đến 100', 'error');
            return;
        }

        try {
            if (voucher) {
                await updateVoucher({ id: voucher._id, data: { voucher_name: name, discount_percent: discount } }).unwrap();
                Swal.fire('Thành công', 'Đã cập nhật khuyến mãi', 'success');
            } else {
                await createVoucher({ voucher_name: name, discount_percent: discount }).unwrap();
                Swal.fire('Thành công', 'Đã thêm khuyến mãi mới', 'success');
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
                <h2>{voucher ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Tên khuyến mãi <span className="required">*</span></label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Nhập tên khuyến mãi..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>% Giảm giá <span className="required">*</span></label>
                        <input 
                            type="number" 
                            value={discountPercent} 
                            onChange={(e) => setDiscountPercent(e.target.value)} 
                            placeholder="Nhập % giảm giá (0-100)..."
                            min="0"
                            max="100"
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-save" disabled={isCreating || isUpdating}>
                            {voucher ? 'Cập nhật' : 'Thêm mới'}
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
