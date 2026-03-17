// store/order/orderSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { createOrderThunk } from './orderThunk';

const orderSlice = createSlice({
    name: 'order',
    initialState: { status: 'idle', error: null, lastOrder: null },
    reducers: {},
    extraReducers: builder => {
        builder
        .addCase(createOrderThunk.pending, state => { state.status = 'loading'; })
        .addCase(createOrderThunk.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.lastOrder = action.payload;
        })
        .addCase(createOrderThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
    }
});
export default orderSlice.reducer;
