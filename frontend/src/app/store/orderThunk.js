// store/order/orderThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiCreateOrder } from '../../apis/order';
import { fetchCartThunk } from './cartThunks';

export const createOrderThunk = createAsyncThunk(
    'order/createOrder',
    async (payload, { dispatch, rejectWithValue }) => {
        try {
        const res = await apiCreateOrder(payload);
        // Sau khi tạo xong, re-fetch cart để xoá
        dispatch(fetchCartThunk());
        return res.order;
        } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);
