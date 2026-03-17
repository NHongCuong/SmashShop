import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Review'],
  endpoints: (builder) => ({
    getReviewsByProduct: builder.query({
      query: (productId) => `reviews/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Review', id: productId }],
    }),
    createReview: builder.mutation({
      query: (reviewData) => ({
        url: 'reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: (result, error, { prod_id }) => [{ type: 'Review', id: prod_id }],
    }),
    deleteReview: builder.mutation({
      query: ({ reviewId, productId }) => ({
        url: `reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Review', id: productId }],
    }),
  }),
});

export const { useGetReviewsByProductQuery, useCreateReviewMutation, useDeleteReviewMutation } = reviewApi;
