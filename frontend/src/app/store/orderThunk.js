// store/order/orderThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiCreateOrder } from '../../apis/order';
import { fetchCartThunk } from './cartThunks';

export const createOrderThunk = createAsyncThunk(
    'order/createOrder',
    async (payload, { dispatch, rejectWithValue }) => {
        try {
        const res = await apiCreateOrder(payload);
        // res is already unwrapped by axios interceptor: { success, _id, order, orderDetail }
        // Sau khi tạo xong, re-fetch cart để cập nhật (cart đã bị xóa trên server)
        dispatch(fetchCartThunk());
        return { _id: res._id, ...res.order };
        } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);
