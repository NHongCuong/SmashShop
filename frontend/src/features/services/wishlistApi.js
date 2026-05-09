import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const wishlistApi = createApi({
  reducerPath: 'wishlistApi',
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
  keepUnusedDataFor: 0,
  tagTypes: ['Wishlist'],
  endpoints: (builder) => ({
    getUserWishlist: builder.query({
      query: () => 'wishlist',
      providesTags: ['Wishlist'],
    }),
    addToWishlist: builder.mutation({
      query: (data) => ({
        url: 'wishlist',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: builder.mutation({
      query: (id) => ({
        url: `wishlist/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
    // ===== ADMIN ENDPOINTS =====
    getAdminWishlists: builder.query({
      query: ({ page = 1, limit = 10, sortBy = 'create_at', sortOrder = 'desc', search = '' }) =>
        `wishlist/admin?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}`,
      providesTags: ['Wishlist'],
    }),
    deleteWishlistAdmin: builder.mutation({
      query: (id) => ({
        url: `wishlist/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
  }),
});

export const { 
  useGetUserWishlistQuery, 
  useAddToWishlistMutation, 
  useRemoveFromWishlistMutation,
  useGetAdminWishlistsQuery,
  useDeleteWishlistAdminMutation,
} = wishlistApi;
