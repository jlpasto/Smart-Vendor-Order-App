import axios from 'axios';

// Configure axios to use the API URL from environment variables
// In development: uses Vite proxy (localhost:5173/api -> localhost:5000/api)
// In production: uses the full backend URL from VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
