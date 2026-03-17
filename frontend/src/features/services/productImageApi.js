import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { productApi } from '../product/productApi';

export const productImageApi = createApi({
  reducerPath: 'productImageApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/` }),
  endpoints: (builder) => ({
    createProductImage: builder.mutation({
      query: (formData) => ({
        url: `productImages/upload`,
        method: 'POST',
        body: formData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate product cache sau khi upload ảnh thành công
          dispatch(productApi.util.invalidateTags(['Product']));
        } catch {}
      },
    }),
    deleteImagesByProductId: builder.mutation({
      query: (id) => ({
        url: `productImages/delete/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(productApi.util.invalidateTags(['Product']));
        } catch {}
      },
    }),
  }),
});

export const { useCreateProductImageMutation, useDeleteImagesByProductIdMutation } = productImageApi;
