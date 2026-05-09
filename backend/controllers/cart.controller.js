import User from '../models/user.model.js';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import ProductImage from '../models/productImage.model.js';
import { v4 as uuidv4 } from 'uuid';

const compareVariants = (v1, v2) => {
    if (!v1 && !v2) return true;
    if (!v1 || !v2) return false;
    const k1 = Object.keys(v1);
    const k2 = Object.keys(v2);
    if (k1.length !== k2.length) return false;
    return k1.every(k => v1[k] === v2[k]);
};

// thêm/giảm sản phẩm trong giỏ hàng
export const addCart = async (req, res) => {
    const user_id = req.user._id;
    const { product_id, quantity, variants } = req.body;

    try {
        const productData = await Product.findById(product_id);
        if (!productData) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const price = productData.price;
        const product_name = productData.prod_name;
        const subtotal = price * quantity;

        let cart_user = await Cart.findOne({ user_id: user_id });

        if (!cart_user) {
            cart_user = new Cart({
                cart_id: uuidv4(),
                user_id: user_id,
                cart: [{
                    product: product_id,
                    product_name,
                    price,
                    selected_variants: variants,
                    quantity,
                    subtotal
                }]
            });
            await cart_user.save();
            return res.status(200).json({ success: true, message: "Create new cart" });
        }

        const itemIndex = cart_user.cart.findIndex(
            item => item.product?.toString() === product_id.toString() && 
                    compareVariants(item.selected_variants, variants)
        );

        if (itemIndex > -1) {
            const newQuantity = cart_user.cart[itemIndex].quantity + quantity;
            if (newQuantity <= 0) {
                cart_user.cart.splice(itemIndex, 1);
            } else {
                cart_user.cart[itemIndex].quantity = newQuantity;
                cart_user.cart[itemIndex].subtotal = newQuantity * price;
            }
        } else {
            if (quantity > 0) {
                cart_user.cart.push({
                    product: product_id,
                    product_name,
                    price,
                    selected_variants: variants,
                    quantity,
                    subtotal
                });
            }
        }

        cart_user.updatedAt = new Date();
        await cart_user.save();

        res.status(200).json({
            success: true,
            message: "Cart updated",
            data: { product_id, quantity }
        });
    } catch (e) {
        console.error("Error in addCart:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// xóa sản phẩm trong giỏ hàng
export const deleteCart = async (req, res) => {
    const user_id = req.user._id;
    const { product_id, variants } = req.body;

    try {
        const cart_user = await Cart.findOne({ user_id: user_id });
        if (!cart_user) return res.status(404).json({ success: false, message: "Cart not found" });

        const itemIndex = cart_user.cart.findIndex(
            item => item.product?.toString() === product_id.toString() && 
                    compareVariants(item.selected_variants, variants)
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

        cart_user.cart.splice(itemIndex, 1);
        cart_user.updatedAt = new Date();
        await cart_user.save();

        res.status(200).json({ success: true, message: "Product deleted from cart" });
    } catch (e) {
        console.error("Error in deleteCart:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// lấy hết sản phẩm trong giỏ hàng
export const getCart = async (req, res) => {
    try {
        const cartDoc = await Cart.findOne({ user_id: req.user._id }).populate('cart.product');
        if (!cartDoc) return res.status(404).json({ message: 'Cart not found' });

        const productIds = cartDoc.cart.filter(i => i.product).map(item => item.product._id);
        const images = await ProductImage.find({
            prod_id: { $in: productIds },
            is_primary_image: true
        }).select('prod_id image');

        const cartWithImages = cartDoc.cart.map(item => {
            if (!item.product) return item;
            const img = images.find(img => img.prod_id.toString() === item.product._id.toString());
            return {
                ...item.toObject(),
                product: {
                    ...item.product.toObject(),
                    image: img?.image || null
                }
            };
        });

        res.json({ cart: cartWithImages });
    } catch (err) {
        console.error("Error in getCart:", err);
        res.status(500).json({ message: 'Error getting cart' });
    }
};

// thay đổi số lượng sản phẩm trong giỏ hàng
export const changeCart = async (req, res) => {
    const user_id = req.user._id;
    const body = req.body;

    try {
        const cart_user = await Cart.findOne({ user_id: user_id });
        if (!cart_user) return res.status(404).json({ success: false, message: "Cart not found" });

        if (Array.isArray(body)) {
            for (const item of body) {
                const product_id = item.product?._id || item.product_id || item.product;
                const variants = item.selected_variants || item.variants;
                const quantity = item.quantity;

                const itemInCart = cart_user.cart.find(c => 
                    c.product?.toString() === product_id.toString() &&
                    compareVariants(c.selected_variants, variants)
                );
                if (itemInCart) {
                    itemInCart.quantity = quantity;
                    itemInCart.subtotal = (itemInCart.price || 0) * quantity;
                }
            }
        } else {
            const { product_id, quantity, variants } = body;
            const itemInCart = cart_user.cart.find(item => 
                item.product?.toString() === product_id.toString() &&
                compareVariants(item.selected_variants, variants)
            );

            if (!itemInCart) return res.status(404).json({ success: false, message: "Product not found in cart" });

            itemInCart.quantity = quantity;
            itemInCart.subtotal = (itemInCart.price || 0) * quantity;
        }

        cart_user.updatedAt = new Date();
        await cart_user.save();
        res.status(200).json({ success: true, message: "Cart updated", data: cart_user.cart });
    } catch (e) {
        console.error("Error in changeCart:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
