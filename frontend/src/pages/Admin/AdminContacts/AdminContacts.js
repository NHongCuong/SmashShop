import React, { useState } from 'react';
import './AdminContacts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useGetContactsQuery, useUpdateContactStatusMutation, useDeleteContactMutation } from '../../../features/contact/contactApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

dayjs.extend(utc);

const AdminContacts = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState('newest');
    const [search, setSearch] = useState('');

    const { data: contactData, isLoading, refetch } = useGetContactsQuery({ page, limit, search, sort });
    const [updateStatus] = useUpdateContactStatusMutation();
    const [deleteContact] = useDeleteContactMutation();

    const contacts = contactData?.data || [];
    const totalPages = contactData?.totalPages || 1;

    const handleStatusChange = async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'processed' : 'pending';
        try {
            await updateStatus({ id, status: newStatus }).unwrap();
        } catch (error) {
            console.error('Failed to update status:', error);
            Swal.fire('Lỗi', 'Cập nhật trạng thái thất bại', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Tin nhắn này sẽ bị xóa vĩnh viễn!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2b9d00',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await deleteContact(id).unwrap();
                Swal.fire('Thành công', 'Xóa tin nhắn thành công!', 'success');
            } catch (error) {
                console.error('Failed to delete contact:', error);
                Swal.fire('Lỗi', 'Xóa thất bại', 'error');
            }
        }
    };

    const handleExportExcel = () => {
        if (!contacts || contacts.length === 0) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất!', 'info');
            return;
        }

        const exportData = contacts.map((contact, index) => ({
            'STT': (page - 1) * limit + index + 1,
            'Họ và tên': contact.name,
            'Email': contact.email,
            'Số điện thoại': contact.phone,
            'Chủ đề': contact.subject,
            'Nội dung': contact.message,
            'Ngày tạo': contact.createdAt ? dayjs(contact.createdAt).utc().format('DD/MM/YYYY hh:mm:ss') : '---',
            'Trạng thái': contact.status === 'pending' ? 'Chưa xử lý' : 'Đã xử lý'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Adjust column widths
        const wscols = [
            { wch: 5 },  // STT
            { wch: 20 }, // Họ và tên
            { wch: 25 }, // Email
            { wch: 15 }, // Số điện thoại
            { wch: 20 }, // Chủ đề
            { wch: 40 }, // Nội dung
            { wch: 20 }, // Ngày tạo
            { wch: 15 }  // Trạng thái
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách liên hệ');
        XLSX.writeFile(workbook, 'Danh_sach_lien_he.xlsx');
    };

    return (
        <div className="admin-contacts">
            <div className="admin-header-flex">
                <h1>Danh sách liên hệ</h1>
                <div className="admin-header-btns">
                    <button className="btn-export-excel" onClick={handleExportExcel}>
                        <FontAwesomeIcon icon={faFileExport} /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="admin-controls-wrapper">
                <div className="controls-left-contact">
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
                </div>
                <div className="controls-right-contact">
                    <input
                        type="text"
                        placeholder="Tìm kiếm liên hệ..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="search-input"
                    />
                    <label>
                        Sắp xếp:
                        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Họ và tên</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Chủ đề</th>
                            <th>Nội dung</th>
                            <th>Ngày tạo</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={9}>Đang tải...</td></tr>
                        ) : contacts.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center' }}>Không có tin nhắn liên hệ nào.</td></tr>
                        ) : (
                            contacts.map((contact, idx) => (
                                <tr key={contact._id}>
                                    <td>{(page - 1) * limit + idx + 1}</td>
                                    <td>{contact.name}</td>
                                    <td>{contact.email}</td>
                                    <td>{contact.phone}</td>
                                    <td>{contact.subject}</td>
                                    <td className="contact-message-cell">
                                        <div className="message-content" title={contact.message}>
                                            {contact.message}
                                        </div>
                                    </td>
                                    <td>{contact.createdAt ? dayjs(contact.createdAt).utc().format('DD/MM/YYYY hh:mm:ss') : '---'}</td>
                                    <td>
                                        <span
                                            className={`status-label ${contact.status}`}
                                            onClick={() => handleStatusChange(contact._id, contact.status)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {contact.status === 'pending' ? 'Chưa xử lý' : 'Đã xử lý'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <FontAwesomeIcon icon={faTrash} className="icon-delete" onClick={() => handleDelete(contact._id)} />
                                    </td>
                                </tr>
                            ))
                        )}
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

export default AdminContacts;
