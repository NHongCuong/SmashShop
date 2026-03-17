import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import dayjs from 'dayjs';
const todayStr = dayjs().format('YYYY-MM-DD');
const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

export const statisticsApi = createApi({
  reducerPath: 'statisticsApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${process.env.REACT_APP_API_URL}/api/v1/` }),
  endpoints: (builder) => ({
    getStatistics: builder.query({
      query: ({ startDate, endDate }) =>
        `dashboard?start_date=${startDate}&end_date=${endDate}`,
      transformResponse: (res) => {
        const chartData = res.data;
       
        const todayData = chartData.find(item => item.date === todayStr) || { revenue: 0, orders: 0, sold: 0 };
        const yesterdayData = chartData.find(item => item.date === yesterdayStr) || { revenue: 0, orders: 0, sold: 0 };

        const calcChange = (todayVal, yesterdayVal) => {
          if (yesterdayVal === 0) return 100;
          return Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100);
        };

        const today = {
          revenue: todayData.revenue || 0,
          orders: todayData.orders || 0,
          sold: todayData.sold || 0,
          change: {
            revenue: calcChange(todayData.revenue, yesterdayData.revenue),
            orders: calcChange(todayData.orders, yesterdayData.orders),
            sold: calcChange(todayData.sold, yesterdayData.sold),
          },
        };

        return {
          today,
          chartData,
        };
      },
    }),
  }),
});

export const { useGetStatisticsQuery } = statisticsApi;
