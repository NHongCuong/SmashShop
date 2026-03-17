import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js'
import OrderDetail from '../models/order_detail.js';
import Product from '../models/product.model.js';


export const fetchOrderHistory = async (req, res) => {
    const userId = req.query.user_id || '';
    const query = (userId) ? {user_id: userId } : {};

    try {
        const order = await Order.find(query)
            .populate({
                path: 'user_id', // Populate the 'orderBy' field
                model: 'User',  // Specify the model to populate with (User model)
                select: 'name email phone_number ' // Optionally select specific fields from the User model
            })
            .sort({createdAt: -1})

        res.status(200).json({success: true, data: order})
    } catch(e) {
        res.status(500).json({success: false, error: e.message})
    }
}

export const createOrder = async (req, res) => {
    try {
        const user_id = req.user._id;
        
        const { name, address, phone, email, note } = req.body.shipping;
        
        // console.log("ok")
        const cartDoc = await Cart.findOne({ user_id: user_id }).populate('cart.product');
        // console.log("ok")
        // console.log(cartDoc," ", user_id, " ",req.user);
        if (!cartDoc || cartDoc.cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
        }
    // Chuẩn bị danh sách items với snapshot giá
        const items = cartDoc.cart.map(ci => ({
            product: ci.product._id,
            quantity: ci.quantity,
            price: ci.product.price
        }));

        // Tính tổng
        const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        // Tạo Order
        const order = await Order.create({
            user_id,
            items,
            shipping: { name, address, phone, email, note },
            total,
            status: "Succeeded",
            paymentmethod: req.body.paymentMethod,
        });
        
        // giảm số lượng sản phẩm trong kho
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock -= item.quantity; // Giảm số lượng trong kho
                product.quantity_sold += item.quantity; // Tăng số lượng đã bán
                await product.save(); // Lưu thay đổi vào cơ sở dữ liệu
            }
        }
        // Xoá giỏ hàng của user
        await Cart.updateOne({ user_id }, { $set: { cart: [] } });

        return res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('Error createOrder:', err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const fetchAllOrders = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;

    try {
        const totalDocument = await Order.countDocuments();  
        const orders = await Order.find({})
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
        res.status(200).json({
            success: true,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalDocument/limit),
            totalItems: totalDocument,
            data: orders})
    } catch (e) {
        res.status(500).json({success: false, error: e.message})
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const orderStatus = ["Processing", "Cancelled", "Succeeded", "Pending"];
        const orderId = req.body.order_id;
        const status = req.body.status;
        
        if (!orderStatus.includes(status)) {
            return res.status(400).json({success: false, message: "Status just be one of Processing, Cancelled, Succeeded"});
        }

        const order = await Order.findByIdAndUpdate(orderId, {status: status}, {new: true});
        if (!order) {
            return res.status(404).json({success: false, message: "Order not found"});
        }
        res.status(200).json({success: true, data: order});
    } catch (e) {
        res.status(500).json({success: false, error: e.message});
    }
}

export const fetchProductDetailsByOrderId = async (req, res) => {
    const orderId = req.params.id;
    try {
        const orderDetails = await OrderDetail.find({order_id: orderId})
            .populate("prod_id")
        if (!orderDetails) {
            return res.status(404).json({success: false, message: "No order details found for this order"});
        }
        res.status(200).json({success: true, data: orderDetails});
    } catch (e) {
        res.status(500).json({success: false, error: e.message});
    }
}