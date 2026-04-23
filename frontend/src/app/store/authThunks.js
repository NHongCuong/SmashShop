// import { createAsyncThunk } from '@reduxjs/toolkit';
// import { fetchCartThunk} from './cartThunks';
// import { apiLogin } from '../../apis/user';

// export const loginThunk = createAsyncThunk(
//     '/login',
//     async (credentials, { dispatch,rejectWithValue  }) => {
//     const res = await apiLogin(credentials);
// // Lấy giá trị cookie với tên 'refreshtoken'
//         // 1. Lưu token ngay khi có
//     localStorage.setItem('authToken', res.token);
//     localStorage.setItem("isAuthenticated", "true");
//     localStorage.setItem("user_id", res.user.id); // nếu có
//     localStorage.setItem("role", res.user.role); // nếu có

//     if (res.user.role === 'user'){
//         dispatch(fetchCartThunk());  // ← đổ đầy luôn cả product details
//     }
//     if (credentials.role === res.user.role) {
//         return res;
//     }
//     else {
//         return rejectWithValue("Không đúng Role");
//     };
// }
// );
import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCartThunk} from './cartThunks';
import { apiLogin } from '../../apis/user';

export const loginThunk = createAsyncThunk(
    '/login',
    async (credentials, { dispatch,rejectWithValue  }) => {
    try {
        const res = await apiLogin(credentials);
    // Lấy giá trị cookie với tên 'refreshtoken'
            // 1. Lưu token ngay khi có
        localStorage.setItem('authToken', res.token);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userId", res.user.id);
        
        //đã kiểm tra role ở RequireAdminAuth.js
        // Đổ cart cho cả user và admin nếu login ở user page
        if (res.user.role === 'user' || res.user.role === 'admin'){
            dispatch(fetchCartThunk());
        }
    
        return res;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || err.message);
    }
}
);