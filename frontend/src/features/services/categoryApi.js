import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const categoryApi = createApi({
  reducerPath: 'categoryApi', // Changed to avoid conflict with other 'api' reducerPaths
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
  tagTypes: ['Category'],
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => 'category',
      providesTags: ['Category'],
      transformResponse: (response) => response.data, 
    }),
    getCategoriesAdmin: builder.query({
      query: (params) => ({
        url: 'category/admin',
        params: params,
      }),
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (formData) => ({
        url: 'category',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: builder.mutation({
      query: ({ id, formData }) => ({
        url: `category/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `category/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    importCategories: builder.mutation({
      query: (formData) => ({
        url: 'category/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const { 
  useGetCategoriesQuery, 
  useGetCategoriesAdminQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useImportCategoriesMutation
} = categoryApi;
