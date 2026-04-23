// features/order/orderApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { statisticsApi } from '../statistics/statisticsApi';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/`,
    prepareHeaders: (headers) => {
      const isAdminPage = window.location.pathname.startsWith('/admin');
      const token = isAdminPage 
        ? localStorage.getItem('adminAuthToken') 
        : localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: ({ page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search = '' } = {}) => {
        let url = `order?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      transformResponse: (response) => ({
        orders: response.data,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        page: response.page,
        limit: response.limit
      }),
      providesTags: ['Orders'],
    }),
    getAllOrders: builder.query({
      query: () => `order?limit=1000000`,
      transformResponse: (response) => response.data,
      providesTags: ['Orders'],
    }),
    updateOrderStatus: builder.mutation({
        query: ({ order_id, status }) => ({
          url: 'order',
          method: 'PUT',
          body: { order_id, status },
        }),
        invalidatesTags: ['Orders'],
        async onQueryStarted(arg, { dispatch, queryFulfilled }) {
          try {
            await queryFulfilled;
            dispatch(statisticsApi.util.invalidateTags(['Statistics']));
          } catch (err) {
            console.error("Failed to invalidate statistics:", err);
          }
        },
    }),
    getOrderById: builder.query({
      query: (id) => `order/single/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `order/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Orders'],
    }),
    updateOrderItem: builder.mutation({
      query: (data) => ({
        url: 'order/item',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Orders', id: orderId }, 'Orders'],
    }),
    deleteOrderItem: builder.mutation({
      query: ({ orderId, itemId }) => ({
        url: `order/item/${orderId}/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: 'Orders', id: orderId }, 'Orders'],
    }),
  })
});

export const { 
  useGetOrdersQuery, 
  useUpdateOrderStatusMutation, 
  useGetOrderByIdQuery, 
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation
} = orderApi;
