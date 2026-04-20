import React, { useState, useEffect } from 'react';
import './AdminOrderDetail.css';
import { 
  useGetOrderByIdQuery, 
  useUpdateOrderStatusMutation, 
  useGetAllOrdersQuery,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation
} from '../../../features/order/orderApi';
import { useGetProductsQuery } from '../../../features/product/productApi';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const { data: order, isLoading, refetch } = useGetOrderByIdQuery(id);
  const { data: allProducts = [] } = useGetProductsQuery();
  const [status, setStatus] = useState('');
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [updateOrderItem] = useUpdateOrderItemMutation();
  const [deleteOrderItem] = useDeleteOrderItemMutation();

  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editProductId, setEditProductId] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState(0);

  const { data: allOrders = [] } = useGetAllOrdersQuery();

  const handleExportExcel = () => {
    if (!allOrders || allOrders.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = allOrders.map((order, index) => ({
      "STT": index + 1,
      "ID đơn hàng": order.order_id,
      "Giá trị đơn": order.total_price ?? order.total,
      "Khách hàng": order.user_id?.name || "Không rõ",
      "Ngày tạo": new Date(order.createdAt).toLocaleDateString(),
      "Trạng thái": order.status,
    }));

    const totalValue = allOrders.reduce((sum, order) => sum + (order.total_price ?? order.total ?? 0), 0);
    dataToExport.push({
      "STT": "Tổng cộng",
      "Giá trị đơn": totalValue
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách đơn hàng");
    XLSX.writeFile(workbook, "Danh_sach_don_hang.xlsx");
  };

  const handleExportDetailedExcel = () => {
    if (!allOrders || allOrders.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = [];
    let stt = 1;

    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        dataToExport.push({
          "STT": stt++,
          "Mã đơn hàng": order.order_id,
          "Khách hàng": order.user_id?.name || "Không rõ",
          "Email": order.user_id?.email || "",
          "Số điện thoại": order.user_id?.phone_number || "",
          "Địa chỉ": order.shipping?.address || "",
          "Ảnh": item.product?.images?.filter(img => img.is_primary_image)[0]?.image || "",
          "Tên sản phẩm": item.product?.prod_name || "",
          "Đơn giá": item.price,
          "Số lượng": item.quantity,
          "Tạm tính": item.price * item.quantity,
          "Phí vận chuyển": 0,
          "Trạng thái đơn hàng": order.status,
          "Ngày đặt hàng": new Date(order.createdAt).toLocaleDateString(),
          "Tổng cộng": order.total,
        });
      });
    });

    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    dataToExport.push({
      "STT": "Tổng doanh thu",
      "Tổng cộng": totalRevenue
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chi tiết đơn hàng");
    XLSX.writeFile(workbook, "Chi_tiet_tat_ca_don_hang.xlsx");
  };

  const statuses = {
    Processing: "processing",
    Succeeded: "succeeded",
    Cancelled: "cancelled",
    Pending: "pending"
  };

  useEffect(() => {
    if (order) setStatus(order.status);
  }, [order]);

  const handleSave = async () => {
    try {
      await updateOrderStatus({ order_id: order._id, status }).unwrap();
      alert(`Trạng thái cập nhật thành công: ${status}`);
      refetch();
    } catch (error) {
      console.error("Cập nhật thất bại:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditProductId(item.product?._id);
    setEditQuantity(item.quantity);
    setEditPrice(item.price);
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    try {
      await updateOrderItem({
        orderId: order._id,
        itemId: editingItem._id,
        productId: editProductId,
        quantity: editQuantity,
        price: editPrice
      }).unwrap();
      alert("Cập nhật sản phẩm thành công!");
      setShowEditDialog(false);
      refetch();
    } catch (error) {
      console.error("Cập nhật thất bại:", error);
      alert("Có lỗi xảy ra khi cập nhật sản phẩm!");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?")) {
      try {
        await deleteOrderItem({ orderId: order._id, itemId }).unwrap();
        alert("Xóa sản phẩm thành công!");
        refetch();
      } catch (error) {
        console.error("Xóa thất bại:", error);
        alert("Có lỗi xảy ra khi xóa sản phẩm!");
      }
    }
  };

  const selectedProduct = allProducts.find(p => p._id === editProductId);

  if (isLoading || !order) return <p>Đang tải hoặc không tìm thấy đơn hàng...</p>;

  return (
    <div className='ad-order-detail-container'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Chi tiết đơn hàng</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-export-excel" onClick={handleExportExcel} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Download file excel tất cả đơn hàng
          </button>
          <button className="btn-export-excel" onClick={handleExportDetailedExcel} style={{ padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Download file excel chi tiết đơn hàng
          </button>
        </div>
      </div>

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
                  <th>Thao tác</th>
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
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          onClick={() => handleEditClick(item)}
                          style={{ padding: '5px', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item._id)}
                          style={{ padding: '5px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
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
            <p>Số điện thoại: {order.user_id?.phone_number}</p>
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

      {showEditDialog && (
        <div className="edit-dialog-overlay">
          <div className="edit-dialog">
            <h3>Chỉnh sửa sản phẩm</h3>
            <div className="edit-field">
              <label>Ảnh sản phẩm:</label>
              <div style={{ marginTop: '5px' }}>
                <img 
                  src={selectedProduct?.images?.filter(img => img.is_primary_image)[0]?.image || 'https://miro.medium.com/v2/resize:fit:754/1*JSehLO-i1Q6ZoeWdFj2YEA.png'} 
                  alt="Product preview" 
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              </div>
            </div>
            <div className="edit-field">
              <label>Sản phẩm:</label>
              <select 
                value={editProductId} 
                onChange={(e) => {
                  const p = allProducts.find(prod => prod._id === e.target.value);
                  setEditProductId(e.target.value);
                  if (p) setEditPrice(p.price);
                }}
              >
                {allProducts.map(p => (
                  <option key={p._id} value={p._id}>{p.prod_name}</option>
                ))}
              </select>
            </div>
            <div className="edit-field">
              <label>Đơn giá:</label>
              <input 
                type="number" 
                value={editPrice} 
                onChange={(e) => setEditPrice(Number(e.target.value))}
              />
            </div>
            <div className="edit-field">
              <label>Số lượng:</label>
              <input 
                type="number" 
                value={editQuantity} 
                onChange={(e) => setEditQuantity(Number(e.target.value))}
              />
            </div>
            <div className="edit-actions">
              <button className="btn-cancel" onClick={() => setShowEditDialog(false)}>Thoát</button>
              <button className="btn-save" onClick={handleEditSave}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;