import axios from "axios";

// Use the Next.js API proxy routes instead of direct backend calls
const API_URL = "/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or other storage
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        // Redirect to login page if needed
        // window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
