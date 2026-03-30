import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://threatlens-backend.onrender.com/api'
    : 'http://localhost:5000/api'
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('threatlens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Client] Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API Client] Unauthorized (401) - Redirecting to login');
      localStorage.removeItem('threatlens_token');
      localStorage.removeItem('threatlens_user');
      window.location.href = '/login';
    }
    if (error.response) {
      console.error(`[API Client] HTTP ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[API Client] No response received:', error.request);
    } else {
      console.error('[API Client] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
