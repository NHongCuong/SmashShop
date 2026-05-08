import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js'
import OrderDetail from '../models/order_detail.js';
import Product from '../models/product.model.js';
import ProductImage from "../models/productImage.model.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from 'uuid';


export const fetchOrderHistory = async (req, res) => {
    const { _id, role } = req.user;

    // Nếu không phải admin, luôn lấy userId từ chính token (req.user._id)
    // Nếu là admin, có thể xem hộ user khác nếu có user_id trong query
    const userId = (role === 'admin') ? (req.query.user_id || _id) : _id;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = { user_id: userId };

    try {
        const totalDocument = await Order.countDocuments(query);
        const order = await Order.find(query)
            .populate({
                path: 'user_id', // Populate the 'orderBy' field
                model: 'User',  // Specify the model to populate with (User model)
                select: 'name email phone_number ' // Optionally select specific fields from the User model
            })
            .populate({
                path: 'items.product',
                model: 'Product'
            })
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalDocument / limit),
            totalItems: totalDocument,
            data: order
        })
    } catch (e) {
        logger.error("Error fetching order history: " + e.message);
        res.status(500).json({ success: false, error: e.message })
    }
}

export const createOrder = async (req, res) => {
    try {
        const user_id = req.user._id;
        const isBuyNow = req.body.isBuyNow === true;

        // Validate shipping data exists
        if (!req.body.shipping) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin giao hàng.' });
        }

        const { name, address, phone, email, note } = req.body.shipping;

        // Validate required shipping fields
        if (!name || !address || !phone || !email) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin giao hàng.' });
        }

        // Validate paymentMethod
        const paymentMethod = req.body.paymentMethod;
        if (!paymentMethod || !['cod', 'vnpay'].includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: 'Phương thức thanh toán không hợp lệ.' });
        }

        let items = [];
        let orderDetailProducts = [];

        if (isBuyNow) {
            // ===== LUỒNG MUA NGAY =====
            const buyNowItems = req.body.items;
            if (!buyNowItems || buyNowItems.length === 0) {
                return res.status(400).json({ success: false, message: 'Không có sản phẩm nào để đặt hàng.' });
            }

            for (const bi of buyNowItems) {
                const product = await Product.findById(bi.product);
                if (!product) {
                    return res.status(400).json({ success: false, message: `Sản phẩm không tồn tại.` });
                }
                items.push({
                    product: product._id,
                    quantity: bi.quantity,
                    price: product.price
                });
                orderDetailProducts.push({
                    product_id: product._id,
                    product_name: product.prod_name,
                    quantity: bi.quantity,
                    price: product.price,
                    total: product.price * bi.quantity
                });
            }
        } else {
            // ===== LUỒNG GIỎ HÀNG =====
            const cartDoc = await Cart.findOne({ user_id: user_id }).populate('cart.product');
            if (!cartDoc || !cartDoc.cart || cartDoc.cart.length === 0) {
                return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
            }

            items = cartDoc.cart.map(ci => ({
                product: ci.product._id,
                quantity: ci.quantity,
                price: ci.product.price
            }));

            orderDetailProducts = cartDoc.cart.map(ci => ({
                product_id: ci.product._id,
                product_name: ci.product.prod_name,
                quantity: ci.quantity,
                price: ci.product.price,
                total: ci.product.price * ci.quantity
            }));
        }

        // Tính tổng tạm tính
        const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        // Lấy thông tin voucher từ body
        const { voucher_id, discountAmount } = req.body;
        const discountVal = Number(discountAmount) || 0;
        const finalTotal = subtotal - discountVal;

        // Kiểm tra và trừ tồn kho (atomic) trước khi tạo đơn hàng
        const updatedItems = [];
        for (const item of items) {
            const product = await Product.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity, quantity_sold: item.quantity } },
                { new: true }
            );

            if (!product) {
                // Rollback nếu có sản phẩm không đủ tồn kho
                for (const updated of updatedItems) {
                    await Product.findByIdAndUpdate(
                        updated.product,
                        { $inc: { stock: updated.quantity, quantity_sold: -updated.quantity } }
                    );
                }
                return res.status(400).json({ success: false, message: 'Một số sản phẩm không đủ số lượng trong kho' });
            }
            updatedItems.push(item);
        }

        // Tạo Order
        const order = await Order.create({
            user_id,
            items,
            shipping: { name, address, phone, email, note },
            total: finalTotal,
            voucher_id: voucher_id || null,
            discount_amount: discountVal,
            status: paymentMethod === 'vnpay' ? "Pending" : "Succeeded",
            paymentmethod: paymentMethod,
        });

        // Tạo Order Detail
        const orderDetailData = {
            order_detail_id: uuidv4(),
            order_id: order._id,
            products: orderDetailProducts
        };
        await OrderDetail.create(orderDetailData);

        // Chỉ xoá giỏ hàng khi đặt hàng từ giỏ hàng (không xoá khi Mua Ngay)
        if (!isBuyNow) {
            await Cart.updateOne({ user_id }, { $set: { cart: [] } });
            logger.info("đã delete cart");
        }

        return res.status(201).json({ success: true, _id: order._id, order, orderDetail: orderDetailData });
    } catch (err) {
        logger.error('Error createOrder:', err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const fetchAllOrders = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search || '';

    const query = {};
    if (search) {
        query.$or = [
            { order_id: { $regex: search, $options: 'i' } },
            { 'shipping.name': { $regex: search, $options: 'i' } },
            { 'shipping.phone': { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const totalDocument = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate({
                path: 'items.product', // Populate the 'product' field within the 'products' array
                model: 'Product', // Specify the model to populate with (Product model)
                populate: {
                    path: 'images',
                    model: 'ProductImage'
                }
            })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'name email phone_number '
            })
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);
        res.status(200).json({
            success: true,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalDocument / limit),
            totalItems: totalDocument,
            data: orders
        })
    } catch (e) {
        logger.error("Error fetching all orders: " + e.message);
        res.status(500).json({ success: false, error: e.message })
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const orderStatus = ["Processing", "Cancelled", "Succeeded", "Pending"];
        const orderId = req.body.order_id;
        const status = req.body.status;

        if (!orderStatus.includes(status)) {
            return res.status(400).json({ success: false, message: "Status just be one of Processing, Cancelled, Succeeded" });
        }

        const order = await Order.findByIdAndUpdate(orderId, { status: status }, { new: true });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.status(200).json({ success: true, data: order });
    } catch (e) {
        logger.error("Error updating order status: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

export const fetchProductDetailsByOrderId = async (req, res) => {
    const orderId = req.params.id;
    try {
        const orderDetails = await OrderDetail.find({ order_id: orderId })
            .populate("prod_id")
        if (!orderDetails) {
            return res.status(404).json({ success: false, message: "No order details found for this order" });
        }
        res.status(200).json({ success: true, data: orderDetails });
    } catch (e) {
        logger.error("Error fetching product details by order id: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

export const fetchOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate({
                path: 'items.product',
                model: 'Product',
                populate: {
                    path: 'images',
                    model: 'ProductImage'
                }
            })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'name email phone_number '
            });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Kiểm tra quyền
        if (req.user.role !== 'admin' && order.user_id?._id.toString() !== req.user._id.toString() && order.user_id?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này." });
        }

        res.status(200).json({ success: true, data: order });
    } catch (e) {
        logger.error("Error fetching order by id: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

export const deleteOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Kiểm tra quyền (Chỉ Admin hoặc chủ đơn hàng mới được xóa)
        if (req.user.role !== 'admin' && order.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa đơn hàng này." });
        }

        await Order.findByIdAndDelete(orderId);
        await OrderDetail.deleteOne({ order_id: orderId });
        res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (e) {
        logger.error("Error deleting order: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

export const updateOrderItem = async (req, res) => {
    try {
        const { orderId, itemId, productId, quantity, price } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Kiểm tra quyền
        if (req.user.role !== 'admin' && order.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa đơn hàng này." });
        }

        const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in order" });
        }

        const oldQuantity = order.items[itemIndex].quantity;
        const quantityDiff = quantity - oldQuantity;

        // Cập nhật thông tin item trong Order
        order.items[itemIndex].product = productId;
        order.items[itemIndex].quantity = quantity;
        order.items[itemIndex].price = price;

        // Cập nhật tồn kho và số lượng đã bán của sản phẩm nếu số lượng thay đổi
        if (quantityDiff !== 0) {
            await Product.findByIdAndUpdate(productId, {
                $inc: {
                    stock: -quantityDiff,
                    quantity_sold: quantityDiff
                }
            });
        }

        // Tính lại tổng cho Order
        order.total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        order.updatedAt = Date.now();
        await order.save();

        // Đồng bộ sang OrderDetail
        const orderDetail = await OrderDetail.findOne({ order_id: orderId });
        if (orderDetail) {
            // Lấy thông tin tất cả sản phẩm hiện có trong đơn hàng để cập nhật OrderDetail
            const updatedProducts = await Promise.all(order.items.map(async (item) => {
                const product = await Product.findById(item.product);
                return {
                    product_id: item.product,
                    product_name: product?.prod_name || "Sản phẩm không rõ",
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                };
            }));

            orderDetail.products = updatedProducts;
            await orderDetail.save();
        }

        res.status(200).json({ success: true, data: order });
    } catch (e) {
        logger.error("Error in updateOrderItem: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

export const deleteOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Kiểm tra quyền
        if (req.user.role !== 'admin' && order.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa đơn hàng này." });
        }

        const deletedItem = order.items.find(item => item._id.toString() === itemId);
        if (deletedItem) {
            // Hoàn tác tồn kho và số lượng đã bán
            await Product.findByIdAndUpdate(deletedItem.product, {
                $inc: {
                    stock: deletedItem.quantity,
                    quantity_sold: -deletedItem.quantity
                }
            });
        }

        order.items = order.items.filter(item => item._id.toString() !== itemId);

        // Tính lại tổng cho Order
        order.total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        order.updatedAt = Date.now();
        await order.save();

        // Đồng bộ sang OrderDetail
        const orderDetail = await OrderDetail.findOne({ order_id: orderId });
        if (orderDetail) {
            const updatedProducts = await Promise.all(order.items.map(async (item) => {
                const product = await Product.findById(item.product);
                return {
                    product_id: item.product,
                    product_name: product?.prod_name || "Sản phẩm không rõ",
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                };
            }));

            orderDetail.products = updatedProducts;
            await orderDetail.save();
        }

        res.status(200).json({ success: true, data: order });
    } catch (e) {
        logger.error("Error in deleteOrderItem: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

