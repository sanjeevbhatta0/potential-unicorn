import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1',
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth store or localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Forbidden: You do not have permission to access this resource');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('API Error:', error.message);
      }
    } else if (error.request) {
      console.error('Network Error: No response received from server');
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper to unwrap API response
const unwrapResponse = <T>(response: any): T => {
  // API returns {success: true, data: {...}} wrapper
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return response.data as T;
  }
  return response as T;
};

// Generic API methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get(url, config).then((res) => unwrapResponse<T>(res.data)),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post(url, data, config).then((res) => unwrapResponse<T>(res.data)),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put(url, data, config).then((res) => unwrapResponse<T>(res.data)),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.patch(url, data, config).then((res) => unwrapResponse<T>(res.data)),

  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete(url, config).then((res) => unwrapResponse<T>(res.data)),
};

export default apiClient;
