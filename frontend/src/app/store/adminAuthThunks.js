import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiLogin } from '../../apis/user';

export const adminLoginThunk = createAsyncThunk(
    'adminAuth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const res = await apiLogin(credentials);
            
            if (res.user.role !== 'admin') {
                return rejectWithValue("Tài khoản này không có quyền truy cập trang quản trị!");
            }

            return res;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);
