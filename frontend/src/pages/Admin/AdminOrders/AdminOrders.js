import React, { useState } from 'react';
import './AdminOrders.css';
import { useNavigate } from 'react-router-dom';
import { useGetOrdersQuery } from '../../../features/order/orderApi';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const { data = {}, isLoading } = useGetOrdersQuery({ page, limit, sortBy: sortField, sortOrder });
  const { orders = [], totalPages = 1 } = data;

  const statuses = {
    Processing: "processing",
    Succeeded: "succeeded",
    Cancelled: "cancelled",
    Pending: "pending"
  };
  return (
    <div className="admin-orders">
      <h2>Danh sách đơn hàng</h2>
      <div className="orders-controls admin-controls">
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
          <label>
            Sắp xếp theo:
            <select value={`${sortField}-${sortOrder}`} onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field);
              setSortOrder(order);
              setPage(1);
            }}>
              <option value="createdAt-desc">Ngày tạo (Mới nhất)</option>
              <option value="createdAt-asc">Ngày tạo (Cũ nhất)</option>
              <option value="total-desc">Giá trị đơn (Giảm dần)</option>
              <option value="total-asc">Giá trị đơn (Tăng dần)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="product-table">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>ID đơn hàng</th>
              <th>Giá trị đơn</th>
              <th>Khách hàng</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6}>Đang tải...</td></tr>
            ) : (
              orders.map((order, idx) => (
                <tr key={order._id} onClick={() => navigate(`/admin/orders/${order._id}`)}>
                  <td>{(page - 1) * limit + idx + 1}</td>
                  <td>{order.order_id}</td>
                  <td>{typeof (order.total_price ?? order.total) === 'number'
                    ? (order.total_price ?? order.total).toLocaleString('vi-VN') + '₫'
                    : '0₫'}</td>
                  <td>{order.user_id?.name || "Không rõ"}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-label ${statuses[order.status] || 'unknown'}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Trang trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>Trang sau</button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;