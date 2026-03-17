import api from "./axios"

export const apiAddItem = (data) => {
    return api.post('api/v1/cart/', data);
}

export const apiUpdateItem = (data) => {
    return api.put('api/v1/cart/', data);
}

export const apiGetItem = () => {
    return api.get('api/v1/cart/');
}

export const apiDeleteItem = (data) => {
    return api.delete('api/v1/cart/', {
        data: data,
        withCredentials: true // nếu cần gửi cookie
    });
}
