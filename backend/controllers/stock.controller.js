import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import logger from '../utils/logger.js';
import { getVietnamTime } from '../utils/dayjs.js';

// Ngưỡng cảnh báo hàng sắp hết (Low stock threshold)
const LOW_STOCK_THRESHOLD = 10;

/**
 * Lấy toàn bộ danh sách tồn kho (dựa trên Product.stock & quantity_sold)
 * GET /api/v1/stock
 */
export const getStocks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const search = (req.query.search || '').trim();
        const sortField = req.query.sortField || 'newest';
        const lowStockOnly = req.query.lowStock === 'true';

        // Build sort
        let sortObj = {};
        if (sortField === 'newest')     sortObj = { create_at: -1 };
        else if (sortField === 'oldest') sortObj = { create_at: 1 };
        else if (sortField === 'az')     sortObj = { prod_name: 1 };
        else if (sortField === 'za')     sortObj = { prod_name: -1 };
        else                            sortObj = { create_at: -1 };

        // Nếu có search theo category → lấy category ids khớp trước
        let categoryIds = null;
        if (search) {
            const matchedCategories = await Category.find({
                category_name: { $regex: search, $options: 'i' }
            }).select('_id');
            categoryIds = matchedCategories.map(c => c._id);
        }

        // Build query
        const query = { is_active: true };
        if (lowStockOnly) {
            query.stock = { $lte: LOW_STOCK_THRESHOLD };
        }
        if (search) {
            query.$or = [
                { prod_name: { $regex: search, $options: 'i' } },
                ...(categoryIds && categoryIds.length > 0
                    ? [{ category_id: { $in: categoryIds } }]
                    : [])
            ];
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category_id', 'category_name')
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .select('prod_name category_id stock quantity_sold create_at update_at');

        // Thêm cờ low_stock
        const dataWithFlag = products.map(p => ({
            _id: p._id,
            prod_name: p.prod_name,
            category_name: p.category_id?.category_name || '---',
            stock: p.stock,
            quantity_sold: p.quantity_sold,
            create_at: p.create_at,
            update_at: p.update_at,
            low_stock: p.stock <= LOW_STOCK_THRESHOLD,
        }));

        res.status(200).json({
            success: true,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
            data: dataWithFlag,
        });
    } catch (err) {
        logger.error('Error getStocks: ' + err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Lấy danh sách sản phẩm sắp hết hàng (low stock alert)
 * GET /api/v1/stock/low-stock
 */
export const getLowStockAlerts = async (req, res) => {
    try {
        const products = await Product.find({
            is_active: true,
            stock: { $lte: LOW_STOCK_THRESHOLD }
        })
            .populate('category_id', 'category_name')
            .sort({ stock: 1 })
            .select('prod_name category_id stock quantity_sold create_at update_at');

        const data = products.map(p => ({
            _id: p._id,
            prod_name: p.prod_name,
            category_name: p.category_id?.category_name || '---',
            stock: p.stock,
            quantity_sold: p.quantity_sold,
            create_at: p.create_at,
            update_at: p.update_at,
            low_stock: true,
        }));

        res.status(200).json({
            success: true,
            count: data.length,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
            data,
        });
    } catch (err) {
        logger.error('Error getLowStockAlerts: ' + err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Cập nhật số lượng tồn kho của sản phẩm
 * PUT /api/v1/stock/:id
 */
export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock === null || isNaN(Number(stock)) || Number(stock) < 0) {
            return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ.' });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { stock: Number(stock), update_at: getVietnamTime() } },
            { new: true }
        ).populate('category_id', 'category_name');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        }

        const isLowStock = product.stock <= LOW_STOCK_THRESHOLD;

        res.status(200).json({
            success: true,
            message: 'Cập nhật tồn kho thành công.',
            low_stock: isLowStock,
            data: {
                _id: product._id,
                prod_name: product.prod_name,
                category_name: product.category_id?.category_name || '---',
                stock: product.stock,
                quantity_sold: product.quantity_sold,
                create_at: product.create_at,
                update_at: product.update_at,
                low_stock: isLowStock,
            },
        });
    } catch (err) {
        logger.error('Error updateStock: ' + err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Reset tồn kho về 0
 * DELETE /api/v1/stock/:id
 */
export const resetStock = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: { stock: 0, update_at: getVietnamTime() } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        }

        res.status(200).json({
            success: true,
            message: 'Đã reset tồn kho về 0.',
        });
    } catch (err) {
        logger.error('Error resetStock: ' + err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};
