import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
  reducerPath: 'userApi',
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
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => 'users/profile',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: 'users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    getOrderHistory: builder.query({
      query: ({ userId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) => 
        `order/order_history?user_id=${userId}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      providesTags: ['User'],
    }),
    getAdminUsers: builder.query({
      query: ({ page = 1, limit = 10, sortBy = 'user_id', sortOrder = 'asc', search = '' } = {}) => {
        let url = `users?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: 'users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateUserMutation, useUpdateProfileMutation, useGetOrderHistoryQuery, useGetAdminUsersQuery, useGetUserByIdQuery, useCreateUserMutation, useDeleteUserMutation  } = userApi;
