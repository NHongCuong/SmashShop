import React, { useState } from 'react';
import './AdminOrderHistories.css';
import { useGetOrderHistoryArchiveQuery } from '../../../features/order/orderApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

dayjs.extend(utc);

const AdminOrderHistories = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortField, setSortField] = useState("deletedAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState("");

    const { data: response = {}, isLoading } = useGetOrderHistoryArchiveQuery({ 
        page, 
        limit, 
        sortBy: sortField, 
        sortOrder, 
        search: searchTerm 
    });

    const historicalOrders = response.data || [];
    const totalPages = response.totalPages || 1;

    // Flatten items for table display if needed, but the user asked for one row with specific columns.
    // Given the column list includes "tên sản phẩm", "kích cỡ", "màu sắc", 
    // it's best to show each product as a separate row to avoid clutter.
    const flatItems = [];
    historicalOrders.forEach((order) => {
        order.items.forEach((item) => {
            flatItems.push({
                ...item,
                order_code: order.order_code,
                user_name: order.user_name,
                shipping: order.shipping,
                total: order.total,
                discount_amount: order.discount_amount,
                status: order.status,
                order_createdAt: order.order_createdAt,
                order_updatedAt: order.order_updatedAt,
                deletedAt: order.deletedAt,
                original_order_id: order.original_order_id,
                history_id: order._id
            });
        });
    });

    const handleExportExcel = () => {
        if (!historicalOrders || historicalOrders.length === 0) {
            Swal.fire('Thông báo', "Không có dữ liệu để xuất!", 'info');
            return;
        }

        const dataToExport = [];
        let stt = 1;

        historicalOrders.forEach((order) => {
            order.items.forEach((item) => {
                dataToExport.push({
                    "STT": stt++,
                    "ID đơn hàng": order.order_code,
                    "Tên sản phẩm": item.product_name,
                    "Số lượng": item.quantity,
                    "Giá trị đơn hàng": order.total,
                    "Giảm giá": order.discount_amount,
                    "Kích cỡ": item.selected_variants?.["Kích cỡ"] || item.selected_variants?.["Size"] || "---",
                    "Màu sắc": item.selected_variants?.["Màu sắc"] || item.selected_variants?.["Color"] || "---",
                    "Khách hàng": order.user_name,
                    "Số điện thoại": order.shipping?.phone,
                    "Trạng thái đơn hàng": order.status,
                    "Ngày tạo": order.order_createdAt ? dayjs(order.order_createdAt).utc().format('DD/MM/YYYY HH:mm') : "---",
                    "Ngày sửa": order.order_updatedAt ? dayjs(order.order_updatedAt).utc().format('DD/MM/YYYY HH:mm') : "---",
                    "Ngày xóa": order.deletedAt ? dayjs(order.deletedAt).utc().format('DD/MM/YYYY HH:mm') : "---",
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lịch sử xóa đơn hàng");
        XLSX.writeFile(workbook, "Lich_su_xoa_don_hang.xlsx");
    };

    const handleEdit = (id) => {
        Swal.fire('Thông báo', 'Chức năng chỉnh sửa lịch sử đang được phát triển.', 'info');
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Xóa vĩnh viễn?',
            text: "Bản ghi lịch sử này sẽ bị xóa khỏi kho lưu trữ!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                // Logic xóa lịch sử (nếu có API)
                Swal.fire('Thông báo', 'Tính năng xóa lịch sử vĩnh viễn chưa được cấu hình API.', 'info');
            }
        });
    };

    return (
        <div className="admin-order-history">
            <div className="admin-header-flex">
                <h2>Lịch sử xóa đơn hàng</h2>
                <button className="btn-export-excel" onClick={handleExportExcel}>
                    <FontAwesomeIcon icon={faFileExport} /> Xuất Excel
                </button>
            </div>

            <div className="admin-controls-flex">
                <div className="controls-left">
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

                <div className="controls-right">
                    <div className="search-box">
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Mã đơn, khách hàng, SĐT, sản phẩm..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <label>
                        Sắp xếp:
                        <select value={`${sortField}-${sortOrder}`} onChange={(e) => {
                            const [field, order] = e.target.value.split('-');
                            setSortField(field);
                            setSortOrder(order);
                            setPage(1);
                        }}>
                            <option value="deletedAt-desc">Ngày xóa (Mới nhất)</option>
                            <option value="deletedAt-asc">Ngày xóa (Cũ nhất)</option>
                            <option value="user_name-asc">Khách hàng (A-Z)</option>
                            <option value="user_name-desc">Khách hàng (Z-A)</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>ID đơn hàng</th>
                            <th>Tên sản phẩm</th>
                            <th>SL</th>
                            <th>Giá trị</th>
                            <th>Giảm giá</th>
                            <th>Kích cỡ</th>
                            <th>Màu sắc</th>
                            <th>Khách hàng</th>
                            <th>Số điện thoại</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Ngày sửa</th>
                            <th>Ngày xóa</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="15" className="text-center">Đang tải dữ liệu...</td></tr>
                        ) : flatItems.length === 0 ? (
                            <tr><td colSpan="15" className="text-center">Không tìm thấy lịch sử đơn hàng.</td></tr>
                        ) : (
                            flatItems.map((item, idx) => (
                                <tr key={`${item.history_id}-${idx}`}>
                                    <td>{(page - 1) * limit + idx + 1}</td>
                                    <td className="order-code">{item.order_code}</td>
                                    <td className="product-name">{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.total?.toLocaleString()}đ</td>
                                    <td>{item.discount_amount?.toLocaleString()}đ</td>
                                    <td>{item.selected_variants?.["Kích cỡ"] || item.selected_variants?.["Size"] || "---"}</td>
                                    <td>{item.selected_variants?.["Màu sắc"] || item.selected_variants?.["Color"] || "---"}</td>
                                    <td className="customer-name">{item.user_name}</td>
                                    <td>{item.shipping?.phone}</td>
                                    <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                                    <td>{item.order_createdAt ? dayjs(item.order_createdAt).utc().format('DD/MM/YYYY HH:mm') : "---"}</td>
                                    <td>{item.order_updatedAt ? dayjs(item.order_updatedAt).utc().format('DD/MM/YYYY HH:mm') : "---"}</td>
                                    <td>{item.deletedAt ? dayjs(item.deletedAt).utc().format('DD/MM/YYYY HH:mm') : "---"}</td>
                                    <td className="actions-cell">
                                        <button className="btn-icon edit" onClick={() => handleEdit(item.history_id)}>
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(item.history_id)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="admin-pagination">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button>
                    <span>Trang {page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau</button>
                </div>
            )}
        </div>
    );
};

export default AdminOrderHistories;
