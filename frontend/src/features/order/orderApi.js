// features/order/orderApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: ({ page = 1, limit = 12 } = {}) => `order?page=${page}&limit=${limit}`,
      transformResponse: (response) => ({
        orders: response.data,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        page: response.page,
        limit: response.limit
      })
    }),
    updateOrderStatus: builder.mutation({
        query: ({ order_id, status }) => ({
          url: 'order',
          method: 'PUT',
          body: { order_id, status },
        }),
        invalidatesTags: ['Orders'],
    }),
  })
});

export const { useGetOrdersQuery, useUpdateOrderStatusMutation } = orderApi;
