import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const typeApi = createApi({
  reducerPath: 'typeApi',
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
  tagTypes: ['Type'],
  endpoints: (builder) => ({
    getTypes: builder.query({
      query: () => 'type',
      providesTags: ['Type'],
      transformResponse: (response) => response.data, 
    }),
    getTypesAdmin: builder.query({
      query: (params) => ({
        url: 'type/admin',
        params: params,
      }),
      providesTags: ['Type'],
    }),
    createType: builder.mutation({
      query: (data) => ({
        url: 'type',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Type'],
    }),
    updateType: builder.mutation({
      query: ({ id, data }) => ({
        url: `type/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Type'],
    }),
    deleteType: builder.mutation({
      query: (id) => ({
        url: `type/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Type'],
    }),
    importTypes: builder.mutation({
      query: (formData) => ({
        url: 'type/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Type'],
    }),
  }),
});

export const { 
  useGetTypesQuery, 
  useGetTypesAdminQuery,
  useCreateTypeMutation,
  useUpdateTypeMutation,
  useDeleteTypeMutation,
  useImportTypesMutation
} = typeApi;
