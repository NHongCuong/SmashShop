import React, { useState } from 'react';
import './AdminReviews.css';
import {
    useGetAdminReviewsQuery,
    useDeleteReviewMutation,
    useUpdateReviewAdminMutation
} from '../../../features/services/reviewApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faStar } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

dayjs.extend(utc);

const AdminReviews = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortField, setSortField] = useState("create_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState("");

    const { data: queryData, isLoading, refetch } = useGetAdminReviewsQuery({
        page,
        limit,
        sortBy: sortField,
        sortOrder,
        search: searchTerm
    });

    const [deleteReview] = useDeleteReviewMutation();
    const [updateReview] = useUpdateReviewAdminMutation();

    const reviews = queryData?.data || [];
    const totalPages = queryData?.totalPages || 1;

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Đánh giá này sẽ bị xóa khỏi hệ thống!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await deleteReview(id).unwrap();
                Swal.fire('Đã xóa!', 'Đánh giá đã được gỡ bỏ.', 'success');
            } catch (error) {
                Swal.fire('Lỗi!', 'Không thể xóa đánh giá này.', 'error');
            }
        }
    };

    const handleOpenEdit = (review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditComment(review.comment);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            await updateReview({
                id: editingReview._id,
                data: { rating: editRating, comment: editComment }
            }).unwrap();

            Swal.fire('Thành công!', 'Đã cập nhật đánh giá.', 'success');
            setIsEditModalOpen(false);
        } catch (error) {
            Swal.fire('Lỗi!', 'Không thể cập nhật đánh giá.', 'error');
        }
    };

    const handleExportExcel = () => {
        if (reviews.length === 0) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất!', 'info');
            return;
        }

        const dataToExport = reviews.map((r, index) => ({
            "STT": (page - 1) * limit + index + 1,
            "Tên người dùng": r.user?.name || "Không rõ",
            "Tên sản phẩm": r.product?.prod_name || "Không rõ",
            "Điểm đánh giá (Rating)": r.rating,
            "Bình luận": r.comment,
            "Ngày tạo": dayjs(r.create_at).utc().format('DD/MM/YYYY HH:mm'),
            "Ngày sửa": r.update_at ? dayjs(r.update_at).utc().format('DD/MM/YYYY HH:mm') : '---'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách đánh giá");
        XLSX.writeFile(workbook, `Danh_sach_danh_gia_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    const handleSortChange = (e) => {
        const value = e.target.value;
        if (value === "newest") {
            setSortField("create_at");
            setSortOrder("desc");
        } else if (value === "oldest") {
            setSortField("create_at");
            setSortOrder("asc");
        } else if (value === "az") {
            setSortField("comment"); // Or maybe by user name if aggregate supported better
            setSortOrder("asc");
        } else if (value === "za") {
            setSortField("comment");
            setSortOrder("desc");
        }
        setPage(1);
    };

    return (
        <div className="admin-reviews">
            <h1>Quản lý đánh giá sản phẩm</h1>

            <div className="reviews-controls admin-controls">
                <div className="controls-left-review">
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
                        Download Excel (Trang hiện tại)
                    </button>
                </div>

                <div className="controls-right-review">
                    <input
                        type="text"
                        placeholder="Tìm theo người dùng, sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                    <label>
                        Sắp xếp theo:
                        <select onChange={handleSortChange}>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="az">A-Z (Nội dung)</option>
                            <option value="za">Z-A (Nội dung)</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="review-table">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên người dùng</th>
                            <th>Tên sản phẩm</th>
                            <th>Rating</th>
                            <th>Bình luận</th>
                            <th>Ngày tạo</th>
                            <th>Ngày sửa</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                        ) : reviews.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center' }}>Không có đánh giá nào.</td></tr>
                        ) : (
                            reviews.map((r, idx) => (
                                <tr key={r._id}>
                                    <td>{(page - 1) * limit + idx + 1}</td>
                                    <td><strong>{r.user?.name || "N/A"}</strong></td>
                                    <td>{r.product?.prod_name || "N/A"}</td>
                                    <td className="rating-stars">
                                        {[...Array(r.rating)].map((_, i) => (
                                            <FontAwesomeIcon key={i} icon={faStar} />
                                        ))}
                                        <span style={{ marginLeft: '5px', color: '#666', fontSize: '0.9rem' }}>({r.rating})</span>
                                    </td>
                                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {r.comment}
                                    </td>
                                    <td>{dayjs(r.create_at).utc().format('DD/MM/YYYY HH:mm:ss')}</td>
                                    <td>{r.update_at ? dayjs(r.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                                    <td>
                                        <div className="action-icons">
                                            <FontAwesomeIcon
                                                icon={faPenToSquare}
                                                className="icon-edit"
                                                onClick={() => handleOpenEdit(r)}
                                                title="Chỉnh sửa"
                                            />
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="icon-delete"
                                                onClick={() => handleDelete(r._id)}
                                                title="Xóa"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
                    <span>Trang {page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button>
                </div>
            )}

            {isEditModalOpen && (
                <div className="edit-modal-backdrop">
                    <div className="edit-modal">
                        <h3>Chỉnh sửa đánh giá</h3>
                        <div className="form-group">
                            <label>Số sao:</label>
                            <select value={editRating} onChange={(e) => setEditRating(Number(e.target.value))}>
                                {[5, 4, 3, 2, 1].map(num => (
                                    <option key={num} value={num}>{num} Sao</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Bình luận:</label>
                            <textarea
                                rows="4"
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                            <button className="btn-save" onClick={handleSaveEdit}>Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
