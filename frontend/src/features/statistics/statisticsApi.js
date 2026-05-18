import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import dayjs from 'dayjs';
const todayStr = dayjs().format('YYYY-MM-DD');
const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

export const statisticsApi = createApi({
  reducerPath: 'statisticsApi',
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
  tagTypes: ['Statistics'],
  endpoints: (builder) => ({
    getStatistics: builder.query({
      query: ({ startDate, endDate }) =>
        `dashboard?start_date=${startDate}&end_date=${endDate}`,
      providesTags: ['Statistics'],
      transformResponse: (res) => {
        const chartData = res.chartData || [];
       
        const todayData = chartData.find(item => item.date === todayStr) || { revenue: 0, orders: 0, sold: 0 };
        const yesterdayData = chartData.find(item => item.date === yesterdayStr) || { revenue: 0, orders: 0, sold: 0 };

        const calcChange = (todayVal, yesterdayVal) => {
          if (yesterdayVal === 0) return todayVal > 0 ? 100 : 0;
          return Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100);
        };

        const today = {
          revenue: todayData.revenue || 0,
          orders: todayData.orders || 0,
          sold: todayData.sold || 0,
          change: {
            revenue: calcChange(todayData.revenue || 0, yesterdayData.revenue || 0),
            orders: calcChange(todayData.orders || 0, yesterdayData.orders || 0),
            sold: calcChange(todayData.sold || 0, yesterdayData.sold || 0),
          },
        };

        return {
          today,
          chartData: chartData,
          totalOverall: res.totalOverall || {},
          productPerformance: res.productPerformance || [],
          allProductsRevenue: res.allProductsRevenue || [],
          lowConversionProducts: res.lowConversionProducts || [],
          conversionRate: res.conversionRate || 0
        };
      },
    }),
    trackVisit: builder.mutation({
      query: () => ({
        url: 'dashboard/track-visit',
        method: 'POST'
      })
    }),
  }),
});

export const { useGetStatisticsQuery, useTrackVisitMutation } = statisticsApi;
