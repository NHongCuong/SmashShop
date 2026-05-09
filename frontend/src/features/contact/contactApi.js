import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const contactApi = createApi({
  reducerPath: 'contactApi',
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
    }
  }),
  tagTypes: ['Contacts'],
  endpoints: (builder) => ({
    getContacts: builder.query({
      query: () => 'contacts',
      providesTags: ['Contacts'],
    }),
    updateContactStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `contacts/${id}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Contacts'],
    }),
    deleteContact: builder.mutation({
      query: (id) => ({
        url: `contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Contacts'],
    }),
  })
});

export const { 
  useGetContactsQuery, 
  useUpdateContactStatusMutation,
  useDeleteContactMutation
} = contactApi;
