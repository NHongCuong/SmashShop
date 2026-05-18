import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const stockApi = createApi({
    reducerPath: 'stockApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('adminAuthToken');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Stock'],
    endpoints: (builder) => ({
        // Lấy danh sách tồn kho (có phân trang, tìm kiếm, sort)
        getStocks: builder.query({
            query: ({ page = 1, limit = 10, search = '', sortField = 'newest', lowStock = false } = {}) => {
                const params = new URLSearchParams();
                params.append('page', page);
                params.append('limit', limit);
                if (search) params.append('search', search);
                if (sortField) params.append('sortField', sortField);
                if (lowStock) params.append('lowStock', 'true');
                return `stock?${params.toString()}`;
            },
            providesTags: ['Stock'],
        }),

        // Lấy danh sách sản phẩm sắp hết hàng
        getLowStockAlerts: builder.query({
            query: () => 'stock/low-stock',
            providesTags: ['Stock'],
        }),

        // Cập nhật số lượng tồn kho
        updateStock: builder.mutation({
            query: ({ id, stock }) => ({
                url: `stock/${id}`,
                method: 'PUT',
                body: { stock },
            }),
            invalidatesTags: ['Stock'],
        }),

        // Reset tồn kho về 0
        resetStock: builder.mutation({
            query: (id) => ({
                url: `stock/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Stock'],
        }),
    }),
});

export const {
    useGetStocksQuery,
    useGetLowStockAlertsQuery,
    useUpdateStockMutation,
    useResetStockMutation,
} = stockApi;
