import React, { useState } from 'react';
import './AdminOrders.css';
import { useNavigate } from 'react-router-dom';
import { useGetOrdersQuery, useGetAllOrdersQuery, useDeleteOrderMutation } from '../../../features/order/orderApi';
import * as XLSX from 'xlsx';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");

  const { data = {}, isLoading } = useGetOrdersQuery({ page, limit, sortBy: sortField, sortOrder, search: searchTerm });
  const { orders = [], totalPages = 1 } = data;

  const { data: allOrders = [] } = useGetAllOrdersQuery();
  const [deleteOrder] = useDeleteOrderMutation();

  const handleDeleteOrder = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
      try {
        await deleteOrder(id).unwrap();
        alert("Xóa đơn hàng thành công!");
      } catch (error) {
        console.error("Xóa thất bại:", error);
        alert("Có lỗi xảy ra khi xóa đơn hàng!");
      }
    }
  };

  const handleExportExcel = () => {
    if (!allOrders || allOrders.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = allOrders.map((order, index) => ({
      "STT": index + 1,
      "ID đơn hàng": order.order_id,
      "Giá trị đơn": order.total_price ?? order.total,
      // "Khách hàng": order.user_id?.name || "Không rõ",
      "Khách hàng": order.shipping?.name || "Không rõ",
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
          // "Khách hàng": order.user_id?.name || "Không rõ",
          // "Email": order.user_id?.email || "",
          // "Số điện thoại": order.user_id?.phone_number || "",
          "Khách hàng": order.shipping?.name || "Không rõ",
          "Email": order.shipping?.email || "",
          "Số điện thoại": order.shipping?.phone || "",
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
    // Note: Summing the 'Tổng cộng' column in a flattened sheet is tricky if it represents order total, 
    // but the user asked to sum the 'Tổng cộng' column. 
    // Usually, in a detail sheet, you sum the 'Tạm tính' column to get the total revenue correctly.
    // However, I will follow the user's specific request for the column named "Tổng cộng".

    // To avoid double-counting if "Tổng cộng" is order total repeated on rows, 
    // I will add a final row with the true total revenue calculated once per order.
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
          <button className="btn-export-excel" onClick={handleExportExcel} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Download file excel tất cả đơn hàng
          </button>
          <button className="btn-export-excel" onClick={handleExportDetailedExcel} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Download file excel chi tiết đơn hàng
          </button>

        </div>
        <div className="controls-right">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          // style={{ marginLeft: '200px', padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', width: '250px' }}
          />
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
              <th>Số điện thoại</th>
              <th>Ngày tạo</th>
              <th>Ngày sửa</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8}>Đang tải...</td></tr>
            ) : (
              orders.map((order, idx) => (
                <tr key={order._id} onClick={() => navigate(`/admin/orders/${order._id}`)}>
                  <td>{(page - 1) * limit + idx + 1}</td>
                  <td>{order.order_id}</td>
                  <td>{typeof (order.total_price ?? order.total) === 'number'
                    ? (order.total_price ?? order.total).toLocaleString('vi-VN') + '₫'
                    : '0₫'}</td>
                  {/* <td>{order.user_id?.name || "Không rõ"}</td>
                  <td>{order.user_id?.phone_number || "Không rõ"}</td> */}
                  <td>{order.shipping?.name || "Không rõ"}</td>
                  <td>{order.shipping?.phone || "Không rõ"}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>{order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : ""}</td>
                  <td>
                    <span className={`status-label ${statuses[order.status] || 'unknown'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-delete-order"
                      onClick={(e) => handleDeleteOrder(e, order._id)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}
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