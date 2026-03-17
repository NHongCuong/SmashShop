import mongoose from 'mongoose';

const OrderDetailSchema = new mongoose.Schema({
    order_detail_id: { type: Number, required: true, unique: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    prod_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
});

const OrderDetail = mongoose.model('OrderDetail', OrderDetailSchema);

export default OrderDetail;