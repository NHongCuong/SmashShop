import {createOrder, fetchAllOrders, updateOrderStatus, fetchProductDetailsByOrderId, fetchOrderHistory, fetchOrderById, deleteOrder, updateOrderItem, deleteOrderItem} from '../controllers/order.controller.js'
import express from 'express'
import {authMiddleware} from "../middleware/auth.js";
import {isAdmin} from "../middleware/auth.js";


const orderRoutes = express.Router();
// Middleware kiểm tra
orderRoutes.use(authMiddleware);      
// Tạo đơn hàng
orderRoutes.post('/',createOrder)
// Fetch lịch sử mua hàng
orderRoutes.get('/order_history', fetchOrderHistory)
// Fetch tất cả đơn hàng (chỉ Admin)
orderRoutes.get('/', isAdmin, fetchAllOrders)
// Cập nhật trạng thái đơn hàng (chỉ Admin)
orderRoutes.put('/', isAdmin, updateOrderStatus)
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

export default orderRoutes