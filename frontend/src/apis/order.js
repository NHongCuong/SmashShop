// apis/order.js
import api from './axios';

export const apiCreateOrder = (payload) =>
    api.post('/api/v1/order/', payload, { withCredentials: true });
