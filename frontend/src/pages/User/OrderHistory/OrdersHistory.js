import React, { useState } from "react";
import "./OrdersHistory.css";
import { useGetOrderHistoryQuery } from "../../../features/user/userApi";
import { useSelector } from "react-redux";

const OrdersHistory = () => {
  const userId = useSelector((state) => state.auth.userId) || localStorage.getItem("userId");
  const reduxId = useSelector((state) => state.auth.userId);
  const storedId = localStorage.getItem("userId");
  // console.log("Redux userId:", reduxId);
  // console.log("LocalStorage userId:", storedId);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // ✅ Gọi hook ở vị trí cố định, dù userId là null
  const { data: responseData, isLoading, error } = useGetOrderHistoryQuery(
    { userId, page, limit, sortBy: sortField, sortOrder },
    { skip: !userId }
  );

  const orders = responseData?.data || [];
  const totalPages = responseData?.totalPages || 1;

  if (!userId) return <p>Không xác định được người dùng.</p>;
  if (isLoading) return <p>Đang tải dữ liệu đơn hàng...</p>;
  if (error) return <p>Đã xảy ra lỗi khi tải đơn hàng!</p>;

  return (
    <div className="orders-history">
      <h2>Đơn hàng đã đặt</h2>

      <div className="orders-controls">
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
              <option value="createdAt-desc">Ngày đặt (Mới nhất)</option>
              <option value="createdAt-asc">Ngày đặt (Cũ nhất)</option>
              <option value="total-desc">Tổng tiền (Giảm dần)</option>
              <option value="total-asc">Tổng tiền (Tăng dần)</option>
            </select>
          </label>
        </div>
      </div>

      <div className="orders-table">
        <div className="order-row order-header">
          <span>STT</span>
          <span>Mã đơn</span>
          <span>Tên sản phẩm</span>
          <span>Số lượng</span>
          <span>Trạng thái</span>
          <span>Ngày</span>
          <span>Tổng tiền</span>
        </div>
        {orders.length > 0 ? (
          orders.map((order, index) => (
            <div key={order._id} className="order-row">
              <span>{(page - 1) * limit + index + 1}</span>
              <span>{order.order_code || order._id}</span>
              <span className="product-name-col">
                {order.items?.map((item, idx) => (
                  <div key={idx}>{item.product?.prod_name || "Sản phẩm"}</div>
                ))}
              </span>
              <span className="product-qty-col">
                {order.items?.map((item, idx) => (
                  <div key={idx}>{item.quantity}</div>
                ))}
              </span>
              <span>{order.status}</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              <span>{Number(order.total || 0).toLocaleString()}đ</span>
            </div>
          ))
        ) : (
          <p>Chưa có đơn hàng nào.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
            Trang trước
          </button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersHistory;
