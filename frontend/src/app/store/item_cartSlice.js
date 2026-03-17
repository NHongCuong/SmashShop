// store/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {apiGetItem} from '../../apis/cart.js'; // giả sử bạn export apiAddItem từ đây


// 1. Tạo async thunk để gọi API và dispatch kết quả
export const GetitemToCart = createAsyncThunk(
    'cart/',
    async ({ rejectWithValue }) => {
        try {
            const response = await apiGetItem();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


const cartSlice = createSlice({
name: 'cart',
initialState: { items: [], status: 'idle', error: null,totalQuantity: 0},
reducers: {
},

extraReducers: builder => {
builder
    .addCase(GetitemToCart.pending, state => {
    state.status = 'loading';
    state.error = null;
    })
    .addCase(GetitemToCart.fulfilled, (state, action) => {
    state.status = 'succeeded';
    // Cập nhật item từ server
    state.item = action.payload;
    console.log(state.totalQuantity);
    })
    .addCase(GetitemToCart.rejected, (state, action) => {
    state.status = 'failed';
    state.error = action.payload;
    });
}
});

export default cartSlice.reducer;
