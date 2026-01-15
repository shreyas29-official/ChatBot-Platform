import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (projectData) => api.post('/projects', projectData),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Chat API
export const chatAPI = {
  getMessages: (projectId) => api.get(`/chat/${projectId}/messages`),
  sendMessage: (projectId, message, imageUrl = null) => api.post(`/chat/${projectId}/messages`, { message, imageUrl }),
  clearHistory: (projectId) => api.delete(`/chat/${projectId}/messages`),
};

// Files API
export const filesAPI = {
  upload: (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/files/${projectId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFiles: (projectId) => api.get(`/files/${projectId}/files`),
  delete: (fileId) => api.delete(`/files/files/${fileId}`),
};

export default api;