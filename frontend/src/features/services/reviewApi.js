import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
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
  tagTypes: ['Review'],
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getReviewsByProduct: builder.query({
      query: (productId) => `reviews/product/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Review', id: productId }],
    }),
    getAdminReviews: builder.query({
      query: ({ page = 1, limit = 10, sortBy = 'create_at', sortOrder = 'desc', search = '' } = {}) => {
        let url = `reviews/admin?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: ['Review'],
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: 'reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: (result, error, { prod_id }) => [{ type: 'Review', id: prod_id }, 'Review'],
    }),
    updateReviewAdmin: builder.mutation({
      query: ({ id, data }) => ({
        url: `reviews/admin/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Review'],
    }),
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const { 
  useGetReviewsByProductQuery, 
  useCreateReviewMutation, 
  useDeleteReviewMutation,
  useGetAdminReviewsQuery,
  useUpdateReviewAdminMutation
} = reviewApi;
