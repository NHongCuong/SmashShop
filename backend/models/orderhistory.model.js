import mongoose from 'mongoose';
import { getVietnamTime } from '../utils/dayjs.js';

const orderHistorySchema = new mongoose.Schema({
    original_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    order_code: { type: String, required: true }, // copy of order_id string
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_name: { type: String }, // snapshot
    items: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            product_name: { type: String },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            selected_variants: { type: mongoose.Schema.Types.Mixed },
        }
    ],
    shipping: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true },
    },
    total: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    status: { type: String },
    paymentmethod: { type: String },
    order_createdAt: { type: Date, default: getVietnamTime },
    order_updatedAt: { type: Date, default: getVietnamTime },
    deletedAt: { type: Date, default: getVietnamTime }
});

const OrderHistory = mongoose.model('OrderHistory', orderHistorySchema);

export default OrderHistory;
