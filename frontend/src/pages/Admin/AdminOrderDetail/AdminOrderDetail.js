// AdminOrderDetail.js
import React, { useState, useEffect } from 'react';
import './AdminOrderDetail.css';
import { useGetOrderByIdQuery, useUpdateOrderStatusMutation  } from '../../../features/order/orderApi';
import { useParams } from 'react-router-dom';


const AdminOrderDetail = () => {
  const statuses = {
    Processing: "processing",
    Succeeded: "succeeded",
    Cancelled: "cancelled",
    Pending: "pending"
  };

  const { id } = useParams(); 
  const { data: order, isLoading, refetch } = useGetOrderByIdQuery(id);
  const [status, setStatus] = useState('');
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  useEffect(() => {
    if (order) setStatus(order.status);
  }, [order]);

  // useEffect(() => {
  //   if (order) setStatus(order.status);
  // }, [order]);

  const handleSave = async () => {
    try {
      await updateOrderStatus({ order_id: order._id, status }).unwrap();
      alert(`Trạng thái cập nhật thành công: ${status}`);
      refetch(); // gọi lại danh sách đơn hàng
    } catch (error) {
      console.error("Cập nhật thất bại:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };
  if (isLoading || !order) return <p>Đang tải hoặc không tìm thấy đơn hàng...</p>;
  return (
    <div className='ad-order-detail-container'>
      <h2>Chi tiết đơn hàng</h2>

      <div className="ad-order-detail">
        <div className="ad-order-left">
          <div className="ad-order-info-box">
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item._id}>
                    <td>{idx + 1}</td>
                    <td>
                    <img
                      src={
                        item.product?.images?.filter(img => img.is_primary_image)[0]?.image ||
                        'https://miro.medium.com/v2/resize:fit:754/1*JSehLO-i1Q6ZoeWdFj2YEA.png'
                      }
                      loading="lazy"
                      alt={item.product?.prod_name || `Sản phẩm ${idx + 1}`}
                      className="ad-order-product-image"
                    />
                    </td>
                    <td className="ad-order-product-name">{item.product?.prod_name || `Sản phẩm ${idx + 1}`}</td>
                    <td className="ad-order-product-price">{item.price.toLocaleString()} đ</td>
                    <td className="ad-order-product-qty">{item.quantity}</td>
                    <td className="ad-order-product-total">{(item.price * item.quantity).toLocaleString()} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ad-order-info-box">
            <p>Tạm tính: {
              order.items.reduce((sum, i) => sum + i.price * i.quantity, 0).toLocaleString()
            } đ</p>
            <p>Phí vận chuyển: 0 đ</p>
            <p><strong>Tổng cộng: {order.total.toLocaleString()} đ</strong></p>
          </div>
        </div>

        <div className="ad-order-right">
          <div className="ad-order-info-box">
            <h3>Tóm tắt</h3>
            <p>Mã đơn hàng: {order.order_id}</p>
            <p>Ngày đặt hàng: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Họ và tên: {order.user_id?.name}</p>
            <p>Email: {order.user_id?.email}</p>
          </div>

          <div className="ad-order-info-box">
            <h3>Địa chỉ</h3>
            <p>{order.shipping?.address || "Chưa có địa chỉ"}</p>
          </div>

          <div className="ad-order-info-box ad-order-status-box">
            <h3>Trạng thái đơn hàng</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`status-label ${statuses[status] || 'unknown'}`}
            >
              {Object.keys(statuses).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <button className="ad-order-save-button" onClick={handleSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;