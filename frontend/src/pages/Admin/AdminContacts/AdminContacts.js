import React from 'react';
import './AdminContacts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useGetContactsQuery, useUpdateContactStatusMutation, useDeleteContactMutation } from '../../../features/contact/contactApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';

dayjs.extend(utc);

const AdminContacts = () => {
    const { data: contacts = [], isLoading } = useGetContactsQuery();
    const [updateStatus] = useUpdateContactStatusMutation();
    const [deleteContact] = useDeleteContactMutation();

    const handleStatusChange = async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'processed' : 'pending';
        try {
            await updateStatus({ id, status: newStatus }).unwrap();
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Cập nhật trạng thái thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
            try {
                await deleteContact(id).unwrap();
            } catch (error) {
                console.error('Failed to delete contact:', error);
                alert('Xóa thất bại');
            }
        }
    };

    const handleExportExcel = () => {
        if (!contacts || contacts.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }

        const exportData = contacts.map((contact, index) => ({
            'STT': index + 1,
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
                            <tr><td colSpan={9}>Không có tin nhắn liên hệ nào.</td></tr>
                        ) : (
                            contacts.map((contact, idx) => (
                                <tr key={contact._id}>
                                    <td>{idx + 1}</td>
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
        </div>
    );
};

export default AdminContacts;
