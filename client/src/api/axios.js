// src/utils/api.js
import axios from "axios";

// Determine base URL based on environment
const getBaseURL = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use empty string (Vite proxy handles /api paths)
  if (import.meta.env.DEV) {
    return "";
  }
  
  // In production, use the production backend URL (paths already include /api)
  return "https://bubt-connect-server.vercel.app";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // or your storage method
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
