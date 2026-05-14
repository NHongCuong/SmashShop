import React, { useState } from 'react';
import './AdminOrderHistories.css';
import { useGetOrderHistoryArchiveQuery, useDeleteOrderHistoryArchiveMutation } from '../../../features/order/orderApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExport, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
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

    const [deleteHistory] = useDeleteOrderHistoryArchiveMutation();

    const historicalOrders = response.data || [];
    const totalPages = response.totalPages || 1;

    const handleExportExcel = () => {
        if (!historicalOrders || historicalOrders.length === 0) {
            Swal.fire('Thông báo', "Không có dữ liệu để xuất!", 'info');
            return;
        }

        const dataToExport = historicalOrders.map((order, index) => ({
            "STT": (page - 1) * limit + index + 1,
            "ID đơn hàng": order.order_code,
            "Tên sản phẩm": order.items.map(item => item.product_name).join(", "),
            "Số lượng": order.items.map(item => item.quantity).join(", "),
            "Giá trị đơn hàng": order.total,
            "Giảm giá": order.discount_amount,
            "Kích cỡ": order.items.map(item => item.selected_variants?.["Kích cỡ"] || item.selected_variants?.["Size"] || "---").join(", "),
            "Màu sắc": order.items.map(item => item.selected_variants?.["Màu sắc"] || item.selected_variants?.["Color"] || "---").join(", "),
            "Khách hàng": order.user_name,
            "Số điện thoại": order.shipping?.phone,
            "Trạng thái đơn hàng": order.status,
            "Ngày tạo": order.order_createdAt ? dayjs(order.order_createdAt).utc().format('DD/MM/YYYY HH:mm') : "---",
            "Ngày sửa": order.order_updatedAt ? dayjs(order.order_updatedAt).utc().format('DD/MM/YYYY HH:mm') : "---",
            "Ngày xóa": order.deletedAt ? dayjs(order.deletedAt).utc().format('DD/MM/YYYY HH:mm') : "---",
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Lịch sử xóa đơn hàng");
        XLSX.writeFile(workbook, "Lich_su_xoa_don_hang.xlsx");
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
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteHistory(id).unwrap();
                    Swal.fire('Thành công', 'Đã xóa bản ghi lịch sử vĩnh viễn.', 'success');
                } catch (e) {
                    Swal.fire('Lỗi', 'Không thể xóa bản ghi: ' + e.message, 'error');
                }
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
                        ) : historicalOrders.length === 0 ? (
                            <tr><td colSpan="15" className="text-center">Không tìm thấy lịch sử đơn hàng.</td></tr>
                        ) : (
                            historicalOrders.map((order, idx) => (
                                <tr key={order._id}>
                                    <td>{(page - 1) * limit + idx + 1}</td>
                                    <td className="order-code">{order.order_code}</td>
                                    <td className="product-name-histories">
                                        {order.items.map((item, i) => (
                                            <React.Fragment key={i}>
                                                <div>{item.product_name}</div>
                                                {i < order.items.length - 1 && <div className="item-separator">-----</div>}
                                            </React.Fragment>
                                        ))}
                                    </td>
                                    <td>
                                        {order.items.map((item, i) => (
                                            <React.Fragment key={i}>
                                                <div>{item.quantity}</div>
                                                {i < order.items.length - 1 && <div className="item-separator">-----</div>}
                                            </React.Fragment>
                                        ))}
                                    </td>
                                    <td>{order.total?.toLocaleString()}đ</td>
                                    <td>{order.discount_amount?.toLocaleString()}đ</td>
                                    <td>
                                        {order.items.map((item, i) => (
                                            <React.Fragment key={i}>
                                                <div>{item.selected_variants?.["Kích cỡ"] || item.selected_variants?.["Size"] || "---"}</div>
                                                {i < order.items.length - 1 && <div className="item-separator">-----</div>}
                                            </React.Fragment>
                                        ))}
                                    </td>
                                    <td>
                                        {order.items.map((item, i) => (
                                            <React.Fragment key={i}>
                                                <div>{item.selected_variants?.["Màu sắc"] || item.selected_variants?.["Color"] || "---"}</div>
                                                {i < order.items.length - 1 && <div className="item-separator">-----</div>}
                                            </React.Fragment>
                                        ))}
                                    </td>
                                    <td className="customer-name">{order.user_name}</td>
                                    <td>{order.shipping?.phone}</td>
                                    <td><span className={`status-badge ${order.status?.toLowerCase()}`}>{order.status}</span></td>
                                    <td>{order.order_createdAt ? dayjs(order.order_createdAt).utc().format('DD/MM/YYYY HH:mm') : "---"}</td>
                                    <td>{order.order_updatedAt ? dayjs(order.order_updatedAt).utc().format('DD/MM/YYYY HH:mm') : "---"}</td>
                                    <td>{order.deletedAt ? dayjs(order.deletedAt).utc().format('DD/MM/YYYY HH:mm') : "---"}</td>
                                    <td className="actions-cell">
                                        <button className="btn-icon delete" onClick={() => handleDelete(order._id)}>
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
