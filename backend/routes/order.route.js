import {createOrder, fetchAllOrders, updateOrderStatus, fetchProductDetailsByOrderId, fetchOrderHistory, fetchOrderById, deleteOrder, updateOrderItem, deleteOrderItem, fetchOrderHistoryArchive, deleteOrderHistoryArchive, fetchPublicOrderInvoice} from '../controllers/order.controller.js'
import express from 'express'
import {authMiddleware} from "../middleware/auth.js";
import {isAdmin} from "../middleware/auth.js";


const orderRoutes = express.Router();

// Route public lấy thông tin hóa đơn (Không cần đăng nhập, phục vụ click từ email)
orderRoutes.get('/public/invoice/:id', fetchPublicOrderInvoice);

// Middleware kiểm tra các route bên dưới
orderRoutes.use(authMiddleware);      
// Tạo đơn hàng
orderRoutes.post('/',createOrder)
// Fetch lịch sử mua hàng
orderRoutes.get('/order_history', fetchOrderHistory)
// Fetch tất cả đơn hàng (chỉ Admin)
orderRoutes.get('/', isAdmin, fetchAllOrders)
// Fetch lịch sử đơn hàng đã xóa (chỉ Admin)
orderRoutes.get('/archive', isAdmin, fetchOrderHistoryArchive)
// Cập nhật trạng thái đơn hàng (Admin hoặc Chủ đơn hàng)
orderRoutes.put('/', updateOrderStatus)
// Lấy thông tin chi tiết đơn hàng
orderRoutes.get('/detail/:id', fetchProductDetailsByOrderId)
// Lấy đơn hàng theo ID
orderRoutes.get('/single/:id', fetchOrderById)
// Xóa đơn hàng
orderRoutes.delete('/:id', deleteOrder)
// Cập nhật item trong đơn hàng
orderRoutes.put('/item', updateOrderItem)
// Xóa item trong đơn hàng
orderRoutes.delete('/item/:orderId/:itemId', deleteOrderItem)

// Xóa lịch sử đơn hàng đã xóa (chỉ Admin)
orderRoutes.delete('/archive/:id', isAdmin, deleteOrderHistoryArchive)

export default orderRoutes