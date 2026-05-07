import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const brandApi = createApi({
  reducerPath: 'brandApi',
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
  tagTypes: ['Brand'],
  endpoints: (builder) => ({
    getBrands: builder.query({
      query: () => 'brand',
      providesTags: ['Brand'],
      transformResponse: (response) => response.data, 
    }),
    getBrandsAdmin: builder.query({
      query: (params) => ({
        url: 'brand/admin',
        params: params,
      }),
      providesTags: ['Brand'],
    }),
    createBrand: builder.mutation({
      query: (data) => ({
        url: 'brand',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Brand'],
    }),
    updateBrand: builder.mutation({
      query: ({ id, data }) => ({
        url: `brand/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Brand'],
    }),
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `brand/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Brand'],
    }),
    importBrands: builder.mutation({
      query: (formData) => ({
        url: 'brand/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Brand'],
    }),
  }),
});

export const { 
  useGetBrandsQuery, 
  useGetBrandsAdminQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useImportBrandsMutation
} = brandApi;
