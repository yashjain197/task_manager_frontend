import axios from 'axios';

const API_URL = 'http://localhost:8000/api/'; // Adjust if your backend URL is different

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (data) => api.post('auth/signin/', data);
export const signup = (data) => api.post('auth/signup/', data);
export const verifyOtp = (data) => api.post('auth/verify-otp/', data);
export const sendOtp = (data) => api.post('auth/send-otp/', data);
export const resetPassword = (data) => api.post('auth/reset-password/', data);
export const confirmResetPassword = (data, uid, token) => api.post(`auth/confirm-reset-password/?uid=${uid}&token=${token}`, data);
export const getPermissions = (userId) => api.get(`auth/permissions/?user_id=${userId}`);
export const fetchUsers = (params = {}) => api.get('auth/fetch-user/', { params });
// Task functions
export const getTasks = (params = {}) => api.get('tasks/', { params });
export const createTask = (data) => api.post('tasks/', data);
export const updateTask = (id, data) => api.put(`tasks/${id}/`, data);
export const deleteTask = (id) => api.delete(`tasks/${id}/`);

// WebSocket connection function
export const connectWebSocket = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const ws = new WebSocket(`ws://localhost:8000/ws/tasks/?token=${token}`);  // Pass token in query string (your middleware supports it)

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return ws;
};

export default api;
