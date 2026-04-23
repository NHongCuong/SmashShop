import axios from 'axios';
import { apiRefresh } from './user';

// Tạo instance chung
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
    timeout: 10000,            // 10s timeout
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // QUAN TRỌNG để cookie được gửi kèm (refresh token)
});

// Request interceptor: tự động đính token
api.interceptors.request.use(
    config => {
        const isAdminPage = window.location.pathname.startsWith('/admin');
        const token = isAdminPage 
            ? localStorage.getItem('adminAuthToken') 
            : localStorage.getItem('authToken');
            
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor: xử lý lỗi chung
api.interceptors.response.use(
    res => res.data,
    async err => {
        const originalRequest = err.config;

        // Nếu accessToken hết hạn và chưa thử refresh
        if (err.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const isAdminPage = window.location.pathname.startsWith('/admin');
                const response = await apiRefresh();
                const newAccessToken = response.newAccessToken;

                // Lưu lại token mới
                if (isAdminPage) {
                    localStorage.setItem('adminAuthToken', newAccessToken);
                    localStorage.setItem("adminIsAuthenticated", "true");
                } else {
                    localStorage.setItem('authToken', newAccessToken);
                    localStorage.setItem("isAuthenticated", "true");
                }

                // Gắn lại header và gọi lại request cũ
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshErr) {
                console.error('Refresh token failed', refreshErr);
                const isAdminPage = window.location.pathname.startsWith('/admin');
                
                // Xóa token và điều hướng login nếu refresh thất bại
                if (isAdminPage) {
                    localStorage.removeItem('adminAuthToken');
                    localStorage.removeItem('adminIsAuthenticated');
                    window.location.href = '/admin-login';
                } else {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('isAuthenticated');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(err);
    }
);

export default api;
