// routes/payment.js
import express from 'express';
import qs from 'qs';
import crypto from 'crypto';
import { createPaymentUrl } from '../controllers/payment.controller.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';

const paymentRoutes = express.Router();

function sortObject(obj) {
   const sorted = {};
   Object.keys(obj).sort().forEach(key => (sorted[key] = obj[key]));
   return sorted;
};

paymentRoutes.post('/create_payment', createPaymentUrl);

paymentRoutes.get('/vnpay_return', async (req, res) => {
   const query = { ...req.query };
   const secureHash = query.vnp_SecureHash;
   delete query.vnp_SecureHash;
   delete query.vnp_SecureHashType;

   const sortedParams = sortObject(query);
   const signData = qs.stringify(sortedParams, { encode: false });
   const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
   const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

   const FE_URL = process.env.FRONTEND_URL || 'https://smashshop.svuit.org';

   if (secureHash === signed) {
      // Trích xuất orderId từ vnp_OrderInfo: "Thanhtoandonhang_<orderId>"
      const orderInfo = query.vnp_OrderInfo || '';
      const orderId = orderInfo.split('_').slice(1).join('_').trim();

      if (query.vnp_ResponseCode === '00') {
         // === THANH TOÁN THÀNH CÔNG ===
         try {
            if (orderId) {
               await Order.findByIdAndUpdate(orderId, { status: "Succeeded" });
            }
         } catch (err) {
            console.error("Error updating order status to Succeeded:", err.message);
         }
         return res.redirect(`${FE_URL}/payment-success?vnp_ResponseCode=00`);
      } else {
         // === THANH TOÁN THẤT BẠI / HỦY -> Rollback tồn kho ===
         try {
            if (orderId) {
               const order = await Order.findById(orderId);
               if (order && order.status === 'Pending') {
                  // Rollback tồn kho cho từng sản phẩm
                  for (const item of order.items) {
                     await Product.findByIdAndUpdate(item.product, {
                        $inc: { stock: item.quantity, quantity_sold: -item.quantity }
                     });
                  }
                  // Đánh dấu đơn hàng là Cancelled
                  order.status = 'Cancelled';
                  await order.save();
               }
            }
         } catch (err) {
            console.error("Error rolling back stock on VNPAY failure:", err.message);
         }
         return res.redirect(`${FE_URL}/payment-success?vnp_ResponseCode=${query.vnp_ResponseCode}`);
      }

   } else {
      return res.status(400).send('Checksum failed');
   }
});

export default paymentRoutes;
