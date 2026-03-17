import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';

export const productApi = createApi({
    reducerPath: 'productApi',
    baseQuery: fetchBaseQuery ({baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/` }),
    tagTypes: ['Product'],
    endpoints: (builder) => ({
        getAllProducts: builder.query({
            query: ({ search, brand, type, category, minPrice, maxPrice, page = 1, limit = 12, sort }) => {
                const params = new URLSearchParams();
                if (search) params.append("search", search);
                if (brand?.length) params.append("brand", brand.join(","));
                if (type?.length) params.append("type", type.join(","));
                if (category) params.append("category", category);
                if (sort) params.append("sort", sort);
                if (minPrice !== '') params.append("minPrice", minPrice); 
                if (maxPrice !== '') params.append("maxPrice", maxPrice); 
                params.append("page", page);
                params.append("limit", limit);
                return `/products?${params.toString()}`;
              },
            transformResponse: (response) => ({
                data: response.data,
                page: response.page,
                totalPages: response.totalPages,
                totalItems: response.totalItems,
                limit: response.limit
            }),
            providesTags: ['Product'],
        }),
        getProducts: builder.query({
            query: () => `products`,
            transformResponse: (response) => response.data,
            providesTags: ['Product'],
        }),
        createProduct: builder.mutation({
            query: (productData) => ({
              url: 'products',
              method: 'POST',
              body: productData,
            }),
            invalidatesTags: ['Product'],
        }),
        updateProduct: builder.mutation({
            query: ({ id, productData }) => ({
              url: `products/${id}`,
              method: 'PUT',
              body: productData,
            }),
            invalidatesTags: ['Product'],
        }),
        getAllBrands: builder.query({
            query: () => `/brand`,
            transformResponse: (response) => response.data, 
        }),
        getAllTypes: builder.query({
            query: () => `/type`,
            transformResponse: (response) => response.data,
        }),
        deactiveProduct: builder.mutation({
            query: (productId) => ({
                url: `products/deactive/${productId}`,
                method: 'PUT',
            }),
            invalidatesTags: ['Product'],
        }),
    })
})
export const { useGetProductsQuery, useGetAllProductsQuery,  useCreateProductMutation, useUpdateProductMutation, useGetAllBrandsQuery, useGetAllTypesQuery, useDeactiveProductMutation  } = productApi;  