import React from 'react';
import './AdminContacts.css';
import { useGetContactsQuery, useUpdateContactStatusMutation, useDeleteContactMutation } from '../../../features/contact/contactApi';
import dayjs from 'dayjs';

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

    return (
        <div className="admin-contacts">
            <h2>Danh sách liên hệ</h2>
            
            <div className="product-table">
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
                                    <td>{dayjs(contact.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                                    <td>
                                        <span 
                                            className={`status-label ${contact.status}`}
                                            onClick={() => handleStatusChange(contact._id, contact.status)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {contact.status === 'pending' ? 'Chưa xử lý' : 'Đã xử lý'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-delete"
                                            onClick={() => handleDelete(contact._id)}
                                        >
                                            Xóa
                                        </button>
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
