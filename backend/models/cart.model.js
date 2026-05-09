import mongoose from 'mongoose';
import { getVietnamTime } from '../utils/dayjs.js';

const CartSchema = mongoose.Schema({
    cart_id: { type: String, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            product_name: String,
            price: Number,
            selected_variants: { type: mongoose.Schema.Types.Mixed }, // { "Màu sắc": "Đỏ", ... }
            quantity: Number,
            subtotal: Number
        }
    ],
    updatedAt: { type: Date, default: getVietnamTime }
});

const Cart = mongoose.model("Cart", CartSchema);
export default Cart;