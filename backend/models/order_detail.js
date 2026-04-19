import mongoose from 'mongoose';

const OrderDetailSchema = new mongoose.Schema({
    order_detail_id: { type: String, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    products: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            product_name: { type: String },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            total: { type: Number, required: true },
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

const OrderDetail = mongoose.model('OrderDetail', OrderDetailSchema);

export default OrderDetail;