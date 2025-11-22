// src/utils/api.js
import axios from "axios";

// Determine base URL based on environment
// Uses runtime hostname detection to work reliably on both desktop and mobile browsers
const getBaseURL = () => {
  // Priority 1: If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Runtime detection - check if we're running on localhost (development)
  // This works reliably on both desktop and mobile browsers
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    hostname === '' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.0.') ||
    hostname.startsWith('172.');
  
  // In development (localhost), use empty string (Vite proxy handles /api paths)
  if (isLocalhost || import.meta.env.DEV) {
    return "";
  }
  
  // Priority 3: In production (including mobile browsers), use the production backend URL
  // Paths already include /api, so we just need the base domain
  return "https://bubt-connect-server.vercel.app";
};

const apiBaseURL = getBaseURL();
const api = axios.create({
  baseURL: apiBaseURL,
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
