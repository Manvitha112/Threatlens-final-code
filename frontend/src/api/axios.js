import axios from 'axios';

/**
 * Axios API client for ThreatLens frontend
 * Handles authentication with JWT tokens and redirects on 401
 */

// Create axios instance with baseURL
const api = axios.create({
baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 * Adds JWT token from localStorage as Authorization Bearer header
 */
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage
    const token = localStorage.getItem('threatlens_token');

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request error
    console.error('[API Client] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles 401 responses and redirects to login
 */
api.interceptors.response.use(
  (response) => {
    // Return successful response as-is
    return response;
  },
  (error) => {
    // Handle response error
    if (error.response && error.response.status === 401) {
      // Log unauthorized error
      console.warn('[API Client] Unauthorized (401) - Redirecting to login');

      // Clear stored token
      localStorage.removeItem('threatlens_token');
      localStorage.removeItem('threatlens_user');

      // Redirect to login page
      window.location.href = '/login';
    }

    // Log other errors
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
