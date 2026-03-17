// src/store/cart/cartSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
    fetchCartThunk,
    changeCartItemThunk,
    removeCartItemThunk
    } from './cartThunks';
import { apiAddItem } from '../../apis/cart';

    // Gửi request lên server để thêm sản phẩm vào giỏ
export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async ({ product_id, quantity }, { rejectWithValue }) => {
        try {
            
            const response = await apiAddItem({ product_id, quantity });
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

    const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],       // array of { product: ..., quantity: ... }
        status: 'idle',  // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null
    },
    reducers: { 
        updateItemQuantity: (state, action) => {
        const { productId, newQuantity } = action.payload;
        const itemIndex = state.items.findIndex(item => item.product._id === productId);
        
        if (itemIndex >= 0) {
            state.items[itemIndex].quantity += newQuantity;
        }
        },
        clearCart: (state) => {
            state.items = [];
        },
      // Các reducer khác nếu có...
    },
    extraReducers: builder => {
        builder
        // fetchCart
        .addCase(fetchCartThunk.pending, state => {
            state.status = 'loading';
            state.error = null;
        })
        .addCase(fetchCartThunk.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.cart = action.payload;
        })
        .addCase(fetchCartThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })

        // changeCartItem (add/update)
        .addCase(changeCartItemThunk.pending, state => {
            state.status = 'loading';
            state.error = null;
        })
        .addCase(changeCartItemThunk.fulfilled, (state,action) => {
            state.status = 'succeeded';
                        // Cập nhật quantity của sản phẩm trong giỏ hàng
            const updatedProduct = action.payload; // Đảm bảo payload chứa thông tin sản phẩm được cập nhật (ví dụ: có id và quantity mới)
            const index = state.items.findIndex(item => item.product._id === updatedProduct.product._id);
            if (index !== -1) {
                state.items[index].quantity = updatedProduct.quantity;
            }
        })
        .addCase(changeCartItemThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })

        // removeCartItem
        .addCase(removeCartItemThunk.pending, state => {
            state.status = 'loading';
            state.error = null;
        })
        .addCase(removeCartItemThunk.fulfilled, state => {
            state.status = 'succeeded';
        })
        .addCase(removeCartItemThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        })
        .addCase(addToCart.pending, state => {
            state.status = 'loading';
            state.error = null;
        })
        .addCase(addToCart.fulfilled, (state, action) => {
            state.status = 'succeeded';
        })
        .addCase(addToCart.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
    }
});

export const { updateItemQuantity, clearCart  } = cartSlice.actions;
export default cartSlice.reducer;
