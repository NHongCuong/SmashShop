import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminGeneralLists.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faFileImport, faPlus } from '@fortawesome/free-solid-svg-icons';
import {
    useGetGeneralImagesQuery,
    useDeleteGeneralImageMutation,
    useImportGeneralImagesMutation
} from '../../../features/services/generalImageApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

dayjs.extend(utc);

export default function AdminGeneralLists() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState("newest");
    const [search, setSearch] = useState("");

    const { data: queryData, refetch, isLoading } = useGetGeneralImagesQuery({ page, limit, sort, search });
    
    const items = queryData?.data || [];
    const totalPages = queryData?.totalPages || 1;

    const [deleteImage] = useDeleteGeneralImageMutation();
    const [importImages, { isLoading: isImporting }] = useImportGeneralImagesMutation();
    const navigate = useNavigate();

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const result = await Swal.fire({
            title: 'Xác nhận import',
            text: "Bạn có muốn import ảnh chung từ file excel này không?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#2b9d00',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await importImages(formData).unwrap();
                Swal.fire('Thành công', res.message, 'success');
                refetch();
            } catch (err) {
                Swal.fire('Thất bại', err?.data?.message || "Import thất bại.", 'error');
            }
        }
        e.target.value = null;
    };

    const handleExportExcel = () => {
        if (!items || items.length === 0) {
            Swal.fire('Thông báo', "Không có dữ liệu để xuất!", 'info');
            return;
        }

        const dataToExport = items.map((item, index) => ({
            "STT": index + 1,
            "Ảnh": item.image?.[0] || "",
            "Url_Image": item.image?.join(', ') || "",
            "Tên ảnh": item.image_name,
            "Ngày tạo": item.create_at ? dayjs(item.create_at).utc().format('DD/MM/YYYY') : "",
            "Ngày sửa": item.updated_at ? dayjs(item.updated_at).utc().format('DD/MM/YYYY') : "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Ảnh chung");
        XLSX.writeFile(workbook, "Danh_sach_anh_chung.xlsx");
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Bạn sẽ không thể khôi phục lại ảnh này!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2b9d00',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý xóa!',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await deleteImage(id).unwrap();
                Swal.fire(
                    'Đã xóa!',
                    'Ảnh của bạn đã được xóa thành công.',
                    'success'
                );
                refetch();
            } catch (err) {
                Swal.fire(
                    'Lỗi!',
                    'Xóa thất bại, vui lòng thử lại.',
                    'error'
                );
            }
        }
    };

    return (
        <div className="admin-general-container">
            <div className="admin-header">
                <h3>Quản lý Ảnh Chung</h3>
                <div className="header-actions">
                    <button className="export-btn" onClick={handleExportExcel}>Xuất Excel</button>
                    <label className="import-btn">
                        <FontAwesomeIcon icon={faFileImport} /> Nhập Excel
                        <input type="file" hidden onChange={handleImportExcel} accept=".xlsx, .xls" />
                    </label>
                    <button className="add-btn" onClick={() => navigate('add')}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm ảnh
                    </button>
                </div>
            </div>

            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="selectors">
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                        <option value={10}>Hiển thị 10</option>
                        <option value={20}>Hiển thị 20</option>
                        <option value={50}>Hiển thị 50</option>
                        <option value={100}>Hiển thị 100</option>
                        <option value={200}>Hiển thị 200</option>
                    </select>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="a-z">A-Z</option>
                        <option value="z-a">Z-A</option>
                    </select>
                </div>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ width: '50px' }}>STT</th>
                        <th style={{ width: '100px' }}>Ảnh</th>
                        <th>Đường dẫn ảnh (Url_Image)</th>
                        <th>Tên ảnh</th>
                        <th>Ngày tạo</th>
                        <th>Ngày sửa</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan="7">Đang tải...</td></tr>
                    ) : items.length === 0 ? (
                        <tr><td colSpan="7">Không tìm thấy ảnh nào.</td></tr>
                    ) : items.map((item, index) => (
                        <tr key={item._id} className="clickable-row">
                            <td onClick={() => navigate(`${item._id}`)}>{(page - 1) * limit + index + 1}</td>
                            <td onClick={() => navigate(`${item._id}`)}>
                                <div className="img-preview-cell">
                                    {item.image?.slice(0, 3).map((img, i) => (
                                        <img key={i} src={img} alt="" />
                                    ))}
                                    {item.image?.length > 3 && <span>+{item.image.length - 3}</span>}
                                </div>
                            </td>
                            <td onClick={() => navigate(`${item._id}`)} className="url-cell">
                                <div className="url-text" title={item.image?.join('\n')}>
                                    {item.image?.[0]}...
                                </div>
                            </td>
                            <td onClick={() => navigate(`${item._id}`)}>{item.image_name}</td>
                            <td onClick={() => navigate(`${item._id}`)}>{dayjs(item.create_at).utc().format('DD/MM/YYYY HH:mm')}</td>
                            <td onClick={() => navigate(`${item._id}`)}>
                                {item.updated_at ? dayjs(item.updated_at).utc().format('DD/MM/YYYY HH:mm') : ''}
                            </td>
                            <td className="actions-cell">
                                <FontAwesomeIcon 
                                    icon={faPenToSquare} 
                                    className="edit-icon" 
                                    onClick={(e) => { e.stopPropagation(); navigate(`edit/${item._id}`); }} 
                                    title="Sửa"
                                />
                                <FontAwesomeIcon 
                                    icon={faTrash} 
                                    className="delete-icon" 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} 
                                    title="Xóa"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button>
                <span className="page-info">Trang {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau</button>
            </div>
        </div>
    );
}
