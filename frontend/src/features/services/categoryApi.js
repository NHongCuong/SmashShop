import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const categoryApi = createApi({
  reducerPath: 'api',
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
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => 'category',
      transformResponse: (response) => response.data, 
    }),
  }),
});

export const { useGetCategoriesQuery } = categoryApi;
