// import { createSlice } from '@reduxjs/toolkit';
// import { loginThunk } from './authThunks';

// const authSlice = createSlice({
//     name: 'auth',
//     initialState: { 
//         isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
//         user: JSON.parse(localStorage.getItem("user")) || null,
//         token: localStorage.getItem("authToken") || null, 
//         userId: localStorage.getItem("userId") || null, 
//         mongoId: localStorage.getItem("mongoId") || null,
//         status: 'idle', 
//         error: null 
//     },
//     reducers: {
//         setAccessToken: (state, action) => {
//             state.accessToken = action.payload;
//             state.isAuthenticated = true;
//         },
//         logout(state) {
//         state.token = null;
//         state.userId = null;
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('userId');
//         state.isAuthenticated = false;
//         localStorage.removeItem("isAuthenticated");
//         },
//     },
//     extraReducers: builder => {
//         builder
//         .addCase(loginThunk.pending, (state) => {
//             state.status = 'loading';
//         })
//         .addCase(loginThunk.fulfilled, (state, action) => {
//             state.status = 'succeeded';
//             state.token  = action.payload.token;
//             state.userId = action.payload.user._id;
//             state.mongoId = action.payload.user.id;
//             state.isAuthenticated = true;
//             // lưu localStorage
//             localStorage.setItem('authToken', state.token);
//             localStorage.setItem('userId', state.userId);
//             localStorage.setItem("mongoId", state.mongoId);
//             localStorage.setItem("isAuthenticated", "true");
//         })
//         .addCase(loginThunk.rejected, (state, action) => {
//             state.status = 'failed';
//             state.error  = action.error.message;
//         });
//     }
// });

// export const selectIsAuthenticated = (state) => !!state.auth.token;

// export const { logout,setAccessToken } = authSlice.actions;
// export default authSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { loginThunk } from './authThunks';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: localStorage.getItem("isAuthenticated") === "true",
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("authToken") || null,
    userId: localStorage.getItem("userId") || null, // ← Mongo _id, dùng cho API
    status: 'idle',
    error: null
  },
  reducers: {
    setAccessToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.token = null;
      state.userId = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      localStorage.removeItem("isAuthenticated");
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.userId = action.payload.user.id || action.payload.user._id;
        state.user = action.payload.user;
        state.isAuthenticated = true;

        // Lưu localStorage
        localStorage.setItem('authToken', state.token);
        localStorage.setItem('userId', state.userId);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem("isAuthenticated", "true");
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const selectIsAuthenticated = (state) => !!state.auth.token;
export const { logout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
