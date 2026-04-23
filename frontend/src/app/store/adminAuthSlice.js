import { createSlice } from '@reduxjs/toolkit';
import { adminLoginThunk } from './adminAuthThunks';

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    isAuthenticated: localStorage.getItem("adminIsAuthenticated") === "true",
    user: JSON.parse(localStorage.getItem("adminUser")) || null,
    token: localStorage.getItem("adminAuthToken") || null,
    userId: localStorage.getItem("adminUserId") || null,
    status: 'idle',
    error: null
  },
  reducers: {
    setAdminAccessToken: (state, action) => {
      if (typeof action.payload === 'string') {
        state.token = action.payload;
      } else {
        const { token, user } = action.payload;
        state.token = token;
        state.user = user;
        state.userId = user?.id || user?._id;
      }
      state.isAuthenticated = true;
    },
    adminLogout(state) {
      state.token = null;
      state.userId = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("adminAuthToken");
      localStorage.removeItem("adminUserId");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("adminIsAuthenticated");
    },
  },
  extraReducers: builder => {
    builder
      .addCase(adminLoginThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(adminLoginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.userId = action.payload.user.id || action.payload.user._id;
        state.user = action.payload.user;
        state.isAuthenticated = true;

        // Lưu localStorage
        localStorage.setItem('adminAuthToken', state.token);
        localStorage.setItem('adminUserId', state.userId);
        localStorage.setItem('adminUser', JSON.stringify(action.payload.user));
        localStorage.setItem("adminIsAuthenticated", "true");
      })
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});

export const selectIsAdminAuthenticated = (state) => !!state.adminAuth.token;
export const { adminLogout, setAdminAccessToken } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
