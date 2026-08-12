import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== '/api'
    ? import.meta.env.VITE_API_URL
    : 'https://omniflow-backend-api.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('omniflow_token') || localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshRes.data.data.token;
        localStorage.setItem('omniflow_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('omniflow_token');
        localStorage.removeItem('omniflow_user');
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
