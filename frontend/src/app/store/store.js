import { configureStore } from '@reduxjs/toolkit';
// eslint-disable-next-line no-unused-vars
import productReducer from '../../features/product/productSlice'
import { productApi } from '../../features/product/productApi';
import { orderApi } from '../../features/order/orderApi.js';
import {userApi} from '../../features/user/userApi.js'
import { categoryApi } from '../../features/services/categoryApi.js';
import { brandApi } from '../../features/services/brandApi.js';
import { typeApi } from '../../features/services/typeApi.js';
import { statisticsApi } from '../../features/statistics/statisticsApi.js';
import { reviewApi } from '../../features/services/reviewApi.js';
import { wishlistApi } from '../../features/services/wishlistApi.js';
import { voucherApi } from '../../features/services/voucherApi.js';
import { contactApi } from '../../features/contact/contactApi.js';
import { postApi } from '../../features/post/postApi.js';
import { generalImageApi } from '../../features/services/generalImageApi.js';
import searchReducer from '../../features/search/searchSlice';
// import productsReducer from '../features/products/productsSlice';
import cartReducer from '../store/cartSlice.js'
import authReducer from './authSlice.js';
import adminAuthReducer from './adminAuthSlice.js';
import orderReducer from './orderSlice.js';
import { rtkQueryErrorLogger } from '../middleware/rtkQueryErrorLogger.js';

export const store = configureStore({ // Khai báo store để lưu trữ state 
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
    order: orderReducer,
    [userApi.reducerPath]: userApi.reducer,

    [productApi.reducerPath]: productApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [statisticsApi.reducerPath]: statisticsApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [typeApi.reducerPath]: typeApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    [voucherApi.reducerPath]: voucherApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
    [generalImageApi.reducerPath]: generalImageApi.reducer,
    cart: cartReducer,
    search: searchReducer,
    // products: productsReducer,
  },  
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
  .concat(rtkQueryErrorLogger)
  .concat(userApi.middleware)
  .concat(productApi.middleware)
  .concat(orderApi.middleware)
  .concat(statisticsApi.middleware)
  .concat(categoryApi.middleware)
  .concat(brandApi.middleware)
  .concat(typeApi.middleware)
  .concat(reviewApi.middleware)
  .concat(wishlistApi.middleware)
  .concat(voucherApi.middleware)
  .concat(contactApi.middleware)
  .concat(postApi.middleware)
  .concat(generalImageApi.middleware)
});
