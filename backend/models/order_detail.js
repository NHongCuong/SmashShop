import mongoose from 'mongoose';

import { getVietnamTime } from '../utils/dayjs.js';

const OrderDetailSchema = new mongoose.Schema({
    order_detail_id: { type: String, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    products: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            product_name: { type: String },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            selected_variants: { type: mongoose.Schema.Types.Mixed },
            total: { type: Number, required: true },
        }
    ],
    createdAt: { type: Date, default: getVietnamTime }
});

const OrderDetail = mongoose.model('OrderDetail', OrderDetailSchema);

export default OrderDetail;