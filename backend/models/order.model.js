// models/order.model.js
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const orderSchema = new mongoose.Schema({
    order_id: { 
        type: String, 
        required: true, 
        unique: true,  // Ensure this field is unique
        default: () => uuidv4()  // Generate a unique UUID for each order
    },
    user_id: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
        product: { type: mongoose.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }, // snapshot giá khi đặt
        }
    ],
    shipping: {
        name:    { type: String, required: true },
        address: { type: String, required: true },
        phone:   { type: String, required: true },
        email:   { type: String, required: true },
        note:    { type: String }
    },
    total:   { type: Number, required: true },
    status:  { type: String, default: 'Pending' }, // Pending, Confirmed, Shipped...
    createdAt: { type: Date, default: Date.now },
    paymentmethod: { type: String, required: true }, // 'cod' or 'vnpay'
});

export default mongoose.model('Order', orderSchema);