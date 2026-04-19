import mongoose from 'mongoose';

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
            quantity: Number,
            subtotal: Number
        }
    ],
    updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model("Cart", CartSchema);
export default Cart;