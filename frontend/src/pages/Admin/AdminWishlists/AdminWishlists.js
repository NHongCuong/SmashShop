import React, { useState } from 'react';
import './AdminWishlists.css';
import {
    useGetAdminWishlistsQuery,
    useDeleteWishlistAdminMutation,
} from '../../../features/services/wishlistApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

dayjs.extend(utc);

const AdminWishlists = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortField, setSortField] = useState("create_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState("");

    const { data: queryData, isLoading } = useGetAdminWishlistsQuery({
        page,
        limit,
        sortBy: sortField,
        sortOrder,
        search: searchTerm
    });

    const [deleteWishlist] = useDeleteWishlistAdminMutation();

    const wishlists = queryData?.data || [];
    const totalPages = queryData?.totalPages || 1;

    const handleSortChange = (value) => {
        switch (value) {
            case 'newest': setSortField('create_at'); setSortOrder('desc'); break;
            case 'oldest': setSortField('create_at'); setSortOrder('asc'); break;
            case 'az': setSortField('prod_name'); setSortOrder('asc'); break;
            case 'za': setSortField('prod_name'); setSortOrder('desc'); break;
            default: setSortField('create_at'); setSortOrder('desc');
        }
        setPage(1);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Xác nhận xóa?',
            text: 'Bạn có chắc chắn muốn xóa mục yêu thích này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await deleteWishlist(id).unwrap();
                Swal.fire('Đã xóa!', 'Mục yêu thích đã được xóa.', 'success');
            } catch (error) {
                Swal.fire('Lỗi!', 'Không thể xóa.', 'error');
            }
        }
    };

    const handleExportExcel = () => {
        if (!wishlists || wishlists.length === 0) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất!', 'info');
            return;
        }

        const dataToExport = wishlists.map((w, index) => ({
            "STT": index + 1,
            "Tên người dùng": w.user?.name || "Không rõ",
            "Tên sản phẩm": w.product?.prod_name || "Không rõ",
            "Ngày tạo": dayjs(w.create_at).utc().format('DD/MM/YYYY HH:mm'),
            "Ngày sửa": w.update_at ? dayjs(w.update_at).utc().format('DD/MM/YYYY HH:mm') : '---'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ưa thích");
        XLSX.writeFile(workbook, "Danh_sach_ua_thich.xlsx");
    };

    return (
        <div className="admin-wishlists">
            <h1>Quản lý Ưa thích</h1>

            <div className="wishlists-controls admin-controls">
                <div className="controls-left-wishlist">
                    <label>
                        Hiển thị:
                        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </label>
                    <button className="btn-export-excel" onClick={handleExportExcel}>
                        Download Excel
                    </button>
                </div>

                <div className="controls-right-wishlist">
                    <input
                        type="text"
                        placeholder="Tìm theo người dùng, sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                    <label>
                        Sắp xếp theo:
                        <select onChange={(e) => handleSortChange(e.target.value)} defaultValue="newest">
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="wishlist-table">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên người dùng</th>
                            <th>Tên sản phẩm</th>
                            <th>Ngày tạo</th>
                            <th>Ngày sửa</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                        ) : wishlists.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu.</td></tr>
                        ) : wishlists.map((w, idx) => (
                            <tr key={w._id}>
                                <td>{(page - 1) * limit + idx + 1}</td>
                                <td>{w.user?.name || 'Không rõ'}</td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {w.product?.prod_name || 'Không rõ'}
                                </td>
                                <td>{dayjs(w.create_at).utc().format('DD/MM/YYYY')}</td>
                                <td>{w.update_at ? dayjs(w.update_at).utc().format('DD/MM/YYYY') : '---'}</td>
                                <td>
                                    <div className="action-icons">
                                        <FontAwesomeIcon
                                            icon={faTrash}
                                            className="icon-delete"
                                            onClick={() => handleDelete(w._id)}
                                            title="Xóa"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="admin-pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button>
                    <span>Trang {page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</button>
                </div>
            )}
        </div>
    );
};

export default AdminWishlists;
