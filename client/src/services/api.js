import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tpc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

let handlingUnauthorized = false;

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/logout');
    if (status === 401 && onUnauthorized && !isAuthCall && !handlingUnauthorized) {
      handlingUnauthorized = true;
      onUnauthorized();
      setTimeout(() => { handlingUnauthorized = false; }, 2000);
    }
    return Promise.reject(error);
  }
);

export const getApiError = (error) => {
  const data = error.response?.data;
  return {
    message: data?.message || error.message || 'Something went wrong',
    code: data?.code || 'ERROR',
    errors: data?.errors || [],
    details: data?.details || [],
    status: error.response?.status || 0,
  };
};

export default api;
