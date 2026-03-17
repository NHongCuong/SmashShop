import api from "./axios"

export const apiGetProduct = async (productId) => {
    return api.get(`api/v1/products/${productId}`);
}

