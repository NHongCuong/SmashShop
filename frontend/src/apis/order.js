// apis/order.js
import api from './axios';

export const apiCreateOrder = (payload) =>
    api.post('/api/v1/order/', payload);

export const apiUpdateOrderStatus = (payload) =>
    api.put('/api/v1/order/', payload);

export const apiDeleteOrder = (id) =>
    api.delete(`/api/v1/order/${id}`);

export const apiGetOrderById = (id) =>
    api.get(`/api/v1/order/single/${id}`);
