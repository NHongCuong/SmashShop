import api from "./axios"

export const apiRegister = (data) => {
    return api.post('api/v1/users/register', data, {
        withCredentials: true // để gửi cookie
}); 
}

export const apiLogin = (data) => {
    return api.post('api/v1/users/login', data, {
        withCredentials: true // để gửi cookie
}); 
}

export const apiRefresh = (data) => {
    return api.post('api/v1/users/refreshtoken', {
        withCredentials: true // để gửi cookie
}); 
}

export const apiForgotPassword = (data) => {
    return api.post('api/v1/users/forgotpassword', data);
}

export const apiResetPassword = (data) => {
    return api.put('api/v1/users/resetpassword', data);
}
