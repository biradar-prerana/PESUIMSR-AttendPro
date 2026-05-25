import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cosec_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => {
    try {
      const preview = res.headers && res.headers['x-email-preview-url'];
      if (preview) {
        try { localStorage.setItem('emailPreviewUrl', preview); } catch (e) { /* ignore */ }
      }
    } catch (e) {}
    return res;
  },
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cosec_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
