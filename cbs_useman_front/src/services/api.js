// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const UserService = {
  // PI operations
  getPIs: () => apiClient.get('/pis/'),
  getPI: (id) => apiClient.get(`/pis/${id}/`),
  createPI: (data) => apiClient.post('/pis/', data),
  updatePI: (id, data) => apiClient.put(`/pis/${id}/`, data),
  
  // User operations
  getUsers: () => apiClient.get('/users/'),
  getUser: (id) => apiClient.get(`/users/${id}/`),
  createUser: (data) => apiClient.post('/users/', data),
  updateUser: (id, data) => apiClient.put(`/users/${id}/`, data),
  
  // Account request operations
  getRequests: () => apiClient.get('/requests/'),
  getRequest: (id) => apiClient.get(`/requests/${id}/`),
  createRequest: (data) => apiClient.post('/requests/', data),
  updateRequest: (id, data) => apiClient.put(`/requests/${id}/`, data),
  approveRequest: (id) => apiClient.post(`/requests/${id}/approve/`),
  rejectRequest: (id, reason) => apiClient.post(`/requests/${id}/reject/`, { reason }),
  
  // Billing operations
  generateBills: (quarter, year) => apiClient.post('/billing/generate/', { quarter, year }),
  getBills: (filters) => apiClient.get('/billing/', { params: filters }),
  getBill: (id) => apiClient.get(`/billing/${id}/`),
};

export const AuthService = {
  login: (credentials) => apiClient.post('/accounts/test-login/', credentials),
  logout: () => apiClient.post('/accounts/test-logout/', ),
  getCurrentUser: () => apiClient.get('/accounts/current-user/'),
};

export default apiClient;