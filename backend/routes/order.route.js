import {createOrder, fetchAllOrders, updateOrderStatus, fetchProductDetailsByOrderId, fetchOrderHistory} from '../controllers/order.controller.js'
import express from 'express'
import {authMiddleware} from "../middleware/auth.js";


const orderRoutes = express.Router();
// Middleware kiểm tra
orderRoutes.use(authMiddleware);      
// Tạo đơn hàng
orderRoutes.post('/',createOrder)
// Fetch lịch sử mua hàng
orderRoutes.get('/order_history', fetchOrderHistory)
// Fetch tất cả đơn hàng
orderRoutes.get('/',fetchAllOrders)
// Cập nhật trạng thái đơn hàng
orderRoutes.put('/', updateOrderStatus)
// Lấy thông tin chi tiết đơn hàng
orderRoutes.get('/detail/:id', fetchProductDetailsByOrderId)

export default orderRoutes