import { configureStore } from '@reduxjs/toolkit';
import productReducer from '../../features/product/productSlice'
import { productApi } from '../../features/product/productApi';
import { orderApi } from '../../features/order/orderApi.js';
import {userApi} from '../../features/user/userApi.js'
import { categoryApi } from '../../features/services/categoryApi.js';
import { statisticsApi } from '../../features/statistics/statisticsApi.js';
import { reviewApi } from '../../features/services/reviewApi.js';
import { wishlistApi } from '../../features/services/wishlistApi.js';
import searchReducer from '../../features/search/searchSlice';
// import productsReducer from '../features/products/productsSlice';
import cartReducer from '../store/cartSlice.js'
import authReducer from './authSlice.js';
import orderReducer from './orderSlice.js';

export const store = configureStore({ // Khai báo store để lưu trữ state 
  reducer: {
    auth: authReducer,
    order: orderReducer,
    [userApi.reducerPath]: userApi.reducer,

    [productApi.reducerPath]: productApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [statisticsApi.reducerPath]: statisticsApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    cart: cartReducer,
    search: searchReducer,
    // products: productsReducer,
  },  
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
  .concat(userApi.middleware)
  .concat(productApi.middleware)
  .concat(orderApi.middleware)
  .concat(statisticsApi.middleware)
  .concat(categoryApi.middleware)
  .concat(reviewApi.middleware)
  .concat(wishlistApi.middleware)
});
