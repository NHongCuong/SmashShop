import express from 'express';
import { authMiddleware, isAdmin } from '../middleware/auth.js';
import { getStocks, getLowStockAlerts, updateStock, resetStock } from '../controllers/stock.controller.js';

const stockRoutes = express.Router();

// Tất cả route cần auth + quyền admin
stockRoutes.use(authMiddleware);
stockRoutes.use(isAdmin);

// Lấy danh sách tồn kho
stockRoutes.get('/', getStocks);

// Lấy danh sách sản phẩm sắp hết hàng
stockRoutes.get('/low-stock', getLowStockAlerts);

// Cập nhật tồn kho
stockRoutes.put('/:id', updateStock);

// Reset tồn kho về 0
stockRoutes.delete('/:id', resetStock);

export default stockRoutes;
