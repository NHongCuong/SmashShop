import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const voucherApi = createApi({
  reducerPath: 'voucherApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/v1/`,
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
  tagTypes: ['Voucher'],
  endpoints: (builder) => ({
    getVouchers: builder.query({
      query: () => 'voucher',
      providesTags: ['Voucher'],
      transformResponse: (response) => response.data, 
    }),
    getVouchersAdmin: builder.query({
      query: (params) => ({
        url: 'voucher/admin',
        params: params,
      }),
      providesTags: ['Voucher'],
    }),
    createVoucher: builder.mutation({
      query: (data) => ({
        url: 'voucher',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Voucher'],
    }),
    updateVoucher: builder.mutation({
      query: ({ id, data }) => ({
        url: `voucher/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Voucher'],
    }),
    deleteVoucher: builder.mutation({
      query: (id) => ({
        url: `voucher/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Voucher'],
    }),
    importVouchers: builder.mutation({
      query: (formData) => ({
        url: 'voucher/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Voucher'],
    }),
  }),
});

export const { 
  useGetVouchersQuery, 
  useGetVouchersAdminQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
  useImportVouchersMutation
} = voucherApi;
