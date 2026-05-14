import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const generalImageApi = createApi({
    reducerPath: 'generalImageApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/v1/general-images`,
        prepareHeaders: (headers) => {
            headers.set('Authorization', `Bearer ${localStorage.getItem('token')}`);
            return headers;
        },
    }),
    tagTypes: ['GeneralImage'],
    endpoints: (builder) => ({
        getGeneralImages: builder.query({
            query: (params) => ({
                url: '/',
                params
            }),
            providesTags: ['GeneralImage'],
        }),
        getGeneralImageById: builder.query({
            query: (id) => `/${id}`,
            providesTags: ['GeneralImage'],
        }),
        createGeneralImage: builder.mutation({
            query: (formData) => ({
                url: '/',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['GeneralImage'],
        }),
        updateGeneralImage: builder.mutation({
            query: ({ id, formData }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['GeneralImage'],
        }),
        deleteGeneralImage: builder.mutation({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['GeneralImage'],
        }),
        importGeneralImages: builder.mutation({
            query: (formData) => ({
                url: '/import',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['GeneralImage'],
        }),
        exportGeneralImages: builder.query({
            query: () => '/export',
        }),
    }),
});

export const {
    useGetGeneralImagesQuery,
    useGetGeneralImageByIdQuery,
    useCreateGeneralImageMutation,
    useUpdateGeneralImageMutation,
    useDeleteGeneralImageMutation,
    useImportGeneralImagesMutation,
    useExportGeneralImagesQuery,
} = generalImageApi;
