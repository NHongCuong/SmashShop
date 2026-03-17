// src/store/cart/cartThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../apis/axios';
import { apiAddItem, apiDeleteItem, apiGetItem, apiUpdateItem } from '../../apis/cart';
import { apiGetProduct } from '../../apis/products';

// 1. Lấy toàn bộ giỏ hàng (GET /cart)
export const fetchCartThunk = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
        const res = await apiGetItem();
        // API trả: { success: true, items: [...] }
        return res.cart;
        } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
    );

    // 2. Thêm hoặc tăng/giảm số lượng (POST /cart)
    //    body: { product_id, quantity }
    export const changeCartItemThunk = createAsyncThunk(
    'cart/changeItem',
    async ({ product_id, quantity }, { dispatch, rejectWithValue }) => {
        try {
        const res = await apiUpdateItem({ product_id, quantity });
        dispatch(fetchCartThunk());

        return {
            product: res.data.product_id,  // Giả sử API trả về thông tin product
            quantity: res.data.quantity  // Giả sử API trả về quantity mới
        };
        } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
    );

    // 3. Xóa hẳn một sản phẩm (DELETE /cart)
    //    body: { product_id }
    export const removeCartItemThunk = createAsyncThunk(
    'cart/removeItem',
    async ({ product_id }, { dispatch, rejectWithValue }) => {
        try {
        await apiDeleteItem({product_id});
        // Sau khi xóa, re-fetch cart
        dispatch(fetchCartThunk());
        } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// 1. Thunk fetch thông tin chi tiết một product
export const fetchProductById = createAsyncThunk(
    'cart/fetchProductById',
    async (product_id, { rejectWithValue }) => {
    try {

        const res = await apiGetProduct(product_id);
        return res; // { id, name, price, ... }
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
    }
);

// // 2. Thunk tổng hợp: fetch cart rồi fetch chi tiết tất cả products trong cart
// export const fetchCartWithProductsThunk = createAsyncThunk(
//     'cart/fetchCartWithProducts',
//     async (_, { dispatch, rejectWithValue }) => {
//     try {
//         // a) Lấy mảng cart items: [{ product: id, quantity }, ...]
//         const cartItems = await dispatch(fetchCartThunk()).unwrap();
//         // console.log("cartItems", cartItems);
//         // b) Với mỗi cartItem, dispatch fetchProductById và chờ kết quả
//         const detailedItems = await Promise.all(
//         cartItems.map(async item => {
//             // console.log("item", item.product);
//             const product = await dispatch(fetchProductById(item.product)).unwrap();
//             // console.log("product", product);
//             return {
//             product: product.data,       // full product detail object
//             quantity: item.quantity
//             };
//         })
//         );

//         // c) Trả về mảng đã ghép
//         return detailedItems; // [ { product: {…}, quantity }, … ]
//     } catch (err) {
//         return rejectWithValue(err);
//     }
//     }
// );
