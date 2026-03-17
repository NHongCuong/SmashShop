import mongoose from 'mongoose';

const CartSchema = mongoose.Schema({
    cart: [
        {
            product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
            },
            quantity: Number
        }
    ],
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Cart = mongoose.model("Cart", CartSchema);
export default Cart;