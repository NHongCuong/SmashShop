import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const postApi = createApi({
  reducerPath: "postApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/`,
    prepareHeaders: (headers) => {
      const isAdminPage = window.location.pathname.startsWith('/admin');
      const token = isAdminPage 
        ? localStorage.getItem('adminAuthToken') 
        : localStorage.getItem('authToken');
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Post"],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params) => ({
        url: "posts",
        params,
      }),
      providesTags: ["Post"],
    }),
    getPostById: builder.query({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: "Post", id }],
    }),
    createPost: builder.mutation({
      query: (newPost) => ({
        url: "posts",
        method: "POST",
        body: newPost,
      }),
      invalidatesTags: ["Post"],
    }),
    updatePost: builder.mutation({
      query: ({ id, ...rest }) => ({
        url: `posts/${id}`,
        method: "PUT",
        body: rest,
      }),
      invalidatesTags: ["Post"],
    }),
    deletePost: builder.mutation({
      query: (id) => ({
        url: `posts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Post"],
    }),
    importPosts: builder.mutation({
      query: (posts) => ({
        url: "posts/import",
        method: "POST",
        body: posts,
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useImportPostsMutation,
} = postApi;
