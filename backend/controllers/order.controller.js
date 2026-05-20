import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js'
import OrderHistory from '../models/orderhistory.model.js';
import OrderDetail from '../models/order_detail.js';
import Product from '../models/product.model.js';
import ProductImage from "../models/productImage.model.js";
import User from '../models/user.model.js';
import logger from "../utils/logger.js";
import { getVietnamTime, formatVietnamTime } from '../utils/dayjs.js';
import { v4 as uuidv4 } from 'uuid';
import sendmail from '../utils/sendmail.js';

import { notifyAdminsOrder } from '../socket/chatSocket.js';


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

        const { name, address, phone, email, note, deliveryType, gender, otherReceiver } = req.body.shipping;

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
                const finalPrice = product.discount > 0
                    ? Math.round(product.price * (1 - product.discount / 100))
                    : product.price;
                items.push({
                    product: product._id,
                    quantity: bi.quantity,
                    price: finalPrice,
                    color: bi.color,
                    price: finalPrice,
                    selected_variants: bi.variants
                });
                orderDetailProducts.push({
                    product_id: product._id,
                    product_name: product.prod_name,
                    quantity: bi.quantity,
                    price: finalPrice,
                    selected_variants: bi.variants,
                    total: finalPrice * bi.quantity
                });
            }
        } else {
            // ===== LUỒNG GIỎ HÀNG =====
            const cartDoc = await Cart.findOne({ user_id: user_id }).populate('cart.product');
            if (!cartDoc || !cartDoc.cart || cartDoc.cart.length === 0) {
                return res.status(400).json({ success: false, message: 'Giỏ hàng trống.' });
            }

            items = cartDoc.cart.map(ci => {
                const finalPrice = ci.product.discount > 0
                    ? Math.round(ci.product.price * (1 - ci.product.discount / 100))
                    : ci.product.price;
                return {
                    product: ci.product._id,
                    quantity: ci.quantity,
                    price: finalPrice,
                    selected_variants: ci.selected_variants
                };
            });

            orderDetailProducts = cartDoc.cart.map(ci => {
                const finalPrice = ci.product.discount > 0
                    ? Math.round(ci.product.price * (1 - ci.product.discount / 100))
                    : ci.product.price;
                return {
                    product_id: ci.product._id,
                    product_name: ci.product.prod_name,
                    quantity: ci.quantity,
                    price: finalPrice,
                    selected_variants: ci.selected_variants,
                    total: finalPrice * ci.quantity
                };
            });
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
            shipping: {
                name,
                address,
                phone,
                email,
                note,
                shipmethod: deliveryType,
                gender: gender,
                otherReceiver: otherReceiver
            },
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

        // Populate items.product to get product names for the frontend
        const populatedOrder = await Order.findById(order._id).populate('items.product');

        // Gửi email xác nhận (không await để không block response)
        // Chỉ gửi ngay cho COD. Với VNPAY sẽ gửi sau khi verify callback thành công.
        if (paymentMethod !== 'vnpay') {
            // sendOrderConfirmationEmail(populatedOrder, req.body.shipping, finalTotal);
            sendAdminOrderNotificationEmail(populatedOrder, req.body.shipping, finalTotal);
            // Gửi thông báo socket tới Admin
            notifyAdminsOrder({
                orderId: order.order_id || order._id,
                message: `Có đơn hàng mới: ${order.order_id || order._id}`,
                time: new Date()
            });
        }

        // Luôn gửi thông báo socket tới Admin khi có đơn hàng mới (kể cả Pending của VNPAY)
        notifyAdminsOrder({
            orderId: order.order_id || order._id,
            message: `Có đơn hàng mới: ${order.order_id || order._id}`,
            status: order.status,
            time: new Date()
        });

        return res.status(201).json({ success: true, _id: order._id, order: populatedOrder, orderDetail: orderDetailData });
    } catch (err) {
        logger.error('Error createOrder:', err);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Hàm gửi mail xác nhận đặt hàng (Tách ra để không block response)
export const sendOrderConfirmationEmail = async (order, shipping, total) => {
    try {
        const itemsHtml = order.items.map(item => {
            const variantsHtml = item.selected_variants
                ? `<div style="font-size: 12px; color: #666;">${Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>`
                : '';
            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold;">${item.product?.prod_name || 'Sản phẩm'}</div>
                        ${variantsHtml}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()}₫</td>
                </tr>
            `;
        }).join('');

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4caf50; text-align: center;">Xác Nhận Đặt Hàng Thành Công</h2>
                <p>Chào <b>${shipping.name}</b>,</p>
                <p>Cảm ơn bạn đã tin tưởng và mua sắm tại <b>HcShop</b>. Đơn hàng của bạn đã được ghi nhận và đang được xử lý.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin đơn hàng</h3>
                    <p style="margin: 5px 0;"><b>Mã đơn hàng:</b> ${order.order_id?.substring(0, 8).toUpperCase() || order._id?.substring(0, 8).toUpperCase()}</p>
                    <p style="margin: 5px 0;"><b>Ngày đặt:</b> ${formatVietnamTime(order.createdAt, 'DD/MM/YYYY')}</p>
                    <p style="margin: 5px 0;"><b>Phương thức thanh toán:</b> ${order.paymentmethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua VNPAY'}</p>
                    <p style="margin: 5px 0;"><b>Phương thức giao nhận:</b> ${order.shipping.shipmethod || 'Giao hàng tận nơi'}</p>
                    <p style="margin: 5px 0;"><b>Dịch vụ vận chuyển:</b> Standard Delivery</p>
                </div>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin giao hàng</h3>
                    <p style="margin: 5px 0;"><b>Tên khách hàng:</b> ${shipping.name}</p>
                    <p style="margin: 5px 0;"><b>Số điện thoại:</b> ${shipping.phone}</p>
                    <p style="margin: 5px 0;"><b>Email:</b> ${shipping.email}</p>
                    <p style="margin: 5px 0;"><b>Địa chỉ:</b> ${shipping.address}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">SL</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Tạm tính:</td>
                            <td style="padding: 10px; text-align: right;">${(order.total + (order.discount_amount || 0)).toLocaleString()}₫</td>
                        </tr>
                        ${order.discount_amount > 0 ? `
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Giảm giá:</td>
                            <td style="padding: 10px; text-align: right; color: #d32f2f;">-${order.discount_amount.toLocaleString()}₫</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Tổng cộng:</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; color: #4caf50; font-size: 18px;">${total.toLocaleString()}₫</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 30px; text-align: center; margin-bottom: 25px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-invoice/${order._id}" 
                       style="background-color: #4caf50; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                        Xuất Hóa Đơn (PDF)
                    </a>
                </div>
                <p style="margin-top: 20px;">Chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin giao hàng.</p>
                <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
            </div>
        `;
        await sendmail(shipping.email, emailContent, "Xác nhận đơn hàng HcShop");
    } catch (error) {
        logger.error("Error sending confirmation email: " + error.message);
    }
};

// Hàm gửi mail thông báo cho Admin khi có đơn hàng mới
export const sendAdminOrderNotificationEmail = async (order, shipping, total) => {
    try {
        // Lấy tất cả admin từ database
        const admins = await User.find({ role: 'admin' }, 'email');

        if (!admins || admins.length === 0) {
            // Fallback gửi về email hệ thống nếu không tìm thấy admin nào trong DB
            const fallbackEmail = process.env.ADMIN_EMAIL || process.env.EMAIL;
            if (fallbackEmail) {
                await sendSingleAdminEmail(fallbackEmail, order, shipping, total);
            }
            return;
        }

        // Gửi email cho từng admin
        const sendPromises = admins.map(admin => {
            if (admin.email) {
                return sendSingleAdminEmail(admin.email, order, shipping, total);
            }
            return Promise.resolve();
        });

        await Promise.all(sendPromises);
    } catch (error) {
        logger.error("Error sending admin notification emails: " + error.message);
    }
};

// Hàm phụ để gửi email cho một địa chỉ cụ thể (Admin)
const sendSingleAdminEmail = async (email, order, shipping, total) => {
    try {
        const itemsHtml = order.items.map(item => {
            const variantsHtml = item.selected_variants
                ? `<div style="font-size: 12px; color: #666;">${Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>`
                : '';
            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold;">${item.product?.prod_name || 'Sản phẩm'}</div>
                        ${variantsHtml}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()}₫</td>
                </tr>
            `;
        }).join('');

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #1976d2; text-align: center;">Thông Báo Đơn Hàng Mới</h2>
                <p>Chào Admin,</p>
                <p>Hệ thống vừa ghi nhận một đơn hàng mới từ khách hàng <b>${shipping.name}</b>.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Chi tiết đơn hàng</h3>
                    <p style="margin: 5px 0;"><b>Mã đơn hàng:</b> ${order.order_id.substring(0, 8).toUpperCase() || order._id.substring(0, 8).toUpperCase()}</p>
                    <p style="margin: 5px 0;"><b>Ngày đặt:</b> ${formatVietnamTime(order.createdAt, 'HH:mm:ss DD/MM/YYYY')}</p>
                    <p style="margin: 5px 0;"><b>Phương thức thanh toán:</b> ${order.paymentmethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua VNPAY'}</p>
                </div>

                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin khách hàng</h3>
                    <p style="margin: 5px 0;"><b>Họ tên:</b> ${shipping.name}</p>
                    <p style="margin: 5px 0;"><b>Số điện thoại:</b> ${shipping.phone}</p>
                    <p style="margin: 5px 0;"><b>Email:</b> ${shipping.email}</p>
                    <p style="margin: 5px 0;"><b>Địa chỉ:</b> ${shipping.address}</p>
                    <p style="margin: 5px 0;"><b>Ghi chú:</b> ${shipping.note || 'Không có'}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">SL</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; color: #d32f2f; font-size: 18px;">${total.toLocaleString()}₫</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-order-detail/${order._id}" 
                       style="background-color: #1976d2; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                        Xem Chi Tiết Tại Dashboard
                    </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">Hệ thống thông báo tự động SmashShop.</p>
            </div>
        `;
        await sendmail(email, emailContent, "Thông báo đơn hàng mới - SmashShop");
    } catch (err) {
        logger.error(`Failed to send email to admin ${email}: ${err.message}`);
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
                path: 'items.product',
                model: 'Product',
                populate: [
                    {
                        path: 'images',
                        model: 'ProductImage'
                    },
                    {
                        path: 'brand_id',
                        model: 'Brand'
                    }
                ]
            })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'name email phone_number '
            })
            .populate('voucher_id')
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
        const userId = req.user._id;
        const userRole = req.user.role;

        if (!orderStatus.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }

        const order = await Order.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }

        // Kiểm tra quyền: Admin hoặc Chủ đơn hàng
        if (userRole !== 'admin' && order.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đơn hàng này" });
        }

        // Nếu chuyển từ trạng thái khác sang Cancelled, hoàn lại tồn kho
        if (status === 'Cancelled' && order.status !== 'Cancelled') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: item.quantity, quantity_sold: -item.quantity }
                });
            }

            // Gửi email thông báo hủy đơn
            const itemsHtml = order.items.map(item => {
                const variantsHtml = item.selected_variants
                    ? `<div style="font-size: 12px; color: #666;">${Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>`
                    : '';
                return `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">
                            <div style="font-weight: bold;">${item.product?.prod_name || 'Sản phẩm'}</div>
                            ${variantsHtml}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()}₫</td>
                    </tr>
                `;
            }).join('');

            const emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #dc3545; text-align: center;">Thông Báo Hủy Đơn Hàng</h2>
                    <p>Chào <b>${order.shipping.name}</b>,</p>
                    <p>Đơn hàng <b>#${order.order_id || order._id}</b> của bạn đã được hủy thành công trên hệ thống <b>HcShop</b>.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin đơn hàng</h3>
                        <p style="margin: 5px 0;"><b>Mã đơn hàng:</b> #${order.order_id || order._id}</p>
                        <p style="margin: 5px 0;"><b>Ngày đặt:</b> ${formatVietnamTime(order.createdAt, 'DD/MM/YYYY')}</p>
                        <p style="margin: 5px 0;"><b>Phương thức thanh toán:</b> ${order.paymentmethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán qua VNPAY'}</p>
                        <p style="margin: 5px 0;"><b>Phương thức giao nhận:</b> ${order.shipping.shipmethod || 'Giao hàng tận nơi'}</p>
                        <p style="margin: 5px 0;"><b>Dịch vụ vận chuyển:</b> Standard Delivery</p>
                    </div>

                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin giao hàng</h3>
                        <p style="margin: 5px 0;"><b>Tên khách hàng:</b> ${order.shipping.name}</p>
                        <p style="margin: 5px 0;"><b>Số điện thoại:</b> ${order.shipping.phone}</p>
                        <p style="margin: 5px 0;"><b>Email:</b> ${order.shipping.email}</p>
                        <p style="margin: 5px 0;"><b>Địa chỉ:</b> ${order.shipping.address}</p>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">SL</th>
                                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Tạm tính:</td>
                                <td style="padding: 10px; text-align: right;">${(order.total + (order.discount_amount || 0)).toLocaleString()}₫</td>
                            </tr>
                            ${order.discount_amount > 0 ? `
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Giảm giá:</td>
                                <td style="padding: 10px; text-align: right; color: #d32f2f;">-${order.discount_amount.toLocaleString()}₫</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Tổng tiền:</td>
                                <td style="padding: 10px; text-align: right; font-weight: bold; color: #d32f2f; font-size: 18px;">${order.total.toLocaleString()}₫</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="margin-top: 30px; text-align: center; margin-bottom: 25px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-invoice/${order._id}" 
                           style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
                            Xem Hóa Đơn Hủy
                        </a>
                    </div>
                    <p style="margin-top: 20px;">Nếu đây là một sự nhầm lẫn hoặc bạn muốn đặt lại sản phẩm, vui lòng truy cập website của chúng tôi.</p>
                    <p>Cảm ơn bạn đã quan tâm đến dịch vụ của HcShop.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
                </div>
            `;
            sendmail(order.shipping.email, emailContent, "Thông báo hủy đơn hàng - HcShop");
        }
        // Nếu chuyển từ Cancelled sang trạng thái khác (Processing, Succeeded, Pending) -> Trừ kho trở lại
        else if (status !== 'Cancelled' && order.status === 'Cancelled') {
            // Kiểm tra xem có đủ hàng không trước khi chuyển trạng thái
            for (const item of order.items) {
                const product = await Product.findById(item.product._id);
                if (!product || product.stock < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Sản phẩm ${product?.prod_name || 'không xác định'} không đủ tồn kho để khôi phục đơn hàng.`
                    });
                }
            }

            // Trừ kho
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: -item.quantity, quantity_sold: item.quantity }
                });
            }
        }

        order.status = status;
        order.updatedAt = getVietnamTime();
        await order.save();

        // Gửi thông báo socket tới Admin về việc cập nhật trạng thái (đặc biệt là Hủy đơn)
        notifyAdminsOrder({
            orderId: order.order_id || order._id,
            status: status,
            type: status === 'Cancelled' ? 'cancelled' : 'status_update',
            message: status === 'Cancelled' ? `Đơn hàng đã bị hủy: ${order.order_id || order._id}` : `Đơn hàng ${order.order_id || order._id} chuyển sang ${status}`,
            time: new Date()
        });

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
                populate: [
                    {
                        path: 'images',
                        model: 'ProductImage'
                    },
                    {
                        path: 'brand_id',
                        model: 'Brand'
                    }
                ]
            })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'name email phone_number '
            })
            .populate('voucher_id');

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
        const order = await Order.findById(orderId).populate('items.product').populate('user_id');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Kiểm tra quyền (Chỉ Admin hoặc chủ đơn hàng mới được xóa)
        if (req.user.role !== 'admin' && order.user_id?._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa đơn hàng này." });
        }

        // Lưu vào lịch sử trước khi xóa
        const historyData = {
            original_order_id: order._id,
            order_code: order.order_id,
            user_id: order.user_id?._id || order.user_id,
            user_name: order.shipping?.name || "Khách hàng",
            items: order.items.map(item => ({
                product_id: item.product?._id || item.product,
                product_name: item.product?.prod_name || "Sản phẩm",
                quantity: item.quantity,
                price: item.price,
                selected_variants: item.selected_variants
            })),
            shipping: {
                name: order.shipping.name,
                address: order.shipping.address,
                phone: order.shipping.phone,
                email: order.shipping.email
            },
            total: order.total,
            discount_amount: order.discount_amount,
            status: order.status,
            paymentmethod: order.paymentmethod,
            order_createdAt: order.createdAt,
            order_updatedAt: order.updatedAt,
            deletedAt: getVietnamTime()
        };

        await OrderHistory.create(historyData);

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
        const { orderId, itemId, productId, quantity, price, variants } = req.body;

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
        order.items[itemIndex].selected_variants = variants;

        // Cập nhật tồn kho và số lượng đã bán của sản phẩm nếu số lượng thay đổi
        if (quantityDiff !== 0) {
            await Product.findByIdAndUpdate(productId, {
                $inc: {
                    stock: -quantityDiff,
                    quantity_sold: quantityDiff
                }
            });
        }

        // Tính lại tổng cho Order (có trừ discountAmount)
        const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        order.total = Math.max(0, subtotal - (order.discount_amount || 0));
        order.updatedAt = getVietnamTime();
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
                    selected_variants: item.selected_variants,
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
            const product = await Product.findById(deletedItem.product);
            // Hoàn tác tồn kho và số lượng đã bán
            if (product) {
                product.stock += deletedItem.quantity;
                product.quantity_sold -= deletedItem.quantity;
                await product.save();
            }

            // Lưu lịch sử xóa sản phẩm chi tiết vào OrderHistory
            await OrderHistory.create({
                original_order_id: order._id,
                order_code: order.order_id,
                user_name: order.shipping?.name || "Khách hàng cũ",
                shipping: order.shipping,
                items: [{
                    product_id: deletedItem.product,
                    product_name: product?.prod_name || "Sản phẩm không rõ",
                    quantity: deletedItem.quantity,
                    price: deletedItem.price,
                    selected_variants: deletedItem.selected_variants
                }],
                total: deletedItem.price * deletedItem.quantity,
                discount_amount: 0,
                status: `Xóa SP chi tiết (Đơn: ${order.status})`,
                paymentmethod: order.paymentmethod,
                order_createdAt: order.createdAt,
                order_updatedAt: order.updatedAt,
                deletedAt: getVietnamTime()
            });
        }

        order.items = order.items.filter(item => item._id.toString() !== itemId);

        // Tính lại tổng cho Order (có trừ discountAmount)
        const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        order.total = Math.max(0, subtotal - (order.discount_amount || 0));
        order.updatedAt = getVietnamTime();
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

export const fetchOrderHistoryArchive = async (req, res) => {
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    const sortBy = req.query.sortBy || 'deletedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const search = req.query.search || '';

    const query = {};
    if (search) {
        query.$or = [
            { order_code: { $regex: search, $options: 'i' } },
            { user_name: { $regex: search, $options: 'i' } },
            { 'shipping.phone': { $regex: search, $options: 'i' } },
            { 'items.product_name': { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const totalDocument = await OrderHistory.countDocuments(query);
        const history = await OrderHistory.find(query)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            page: page,
            limit: limit,
            totalPages: Math.ceil(totalDocument / limit),
            totalItems: totalDocument,
            data: history
        })
    } catch (e) {
        logger.error("Error fetching order history archive: " + e.message);
        res.status(500).json({ success: false, error: e.message })
    }
}

export const deleteOrderHistoryArchive = async (req, res) => {
    try {
        const historyId = req.params.id;
        const result = await OrderHistory.findByIdAndDelete(historyId);
        if (!result) {
            return res.status(404).json({ success: false, message: "Bản ghi lịch sử không tồn tại." });
        }
        res.status(200).json({ success: true, message: "Xóa lịch sử thành công." });
    } catch (e) {
        logger.error("Error deleting order history archive: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

export const fetchPublicOrderInvoice = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate({
                path: 'items.product',
                model: 'Product',
                populate: [
                    {
                        path: 'images',
                        model: 'ProductImage'
                    },
                    {
                        path: 'brand_id',
                        model: 'Brand'
                    }
                ]
            })
            .populate({
                path: 'user_id',
                model: 'User',
                select: 'name email phone_number'
            })
            .populate('voucher_id');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, data: order });
    } catch (e) {
        logger.error("Error fetching public order invoice: " + e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}
