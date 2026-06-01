import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxy in vite config handles the rest
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────
// Adjunta el JWT a cada petición automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neonbench_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────
// Distingue entre errores de validación (400) y errores globales (401, 409, 5xx)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // 401 — Token expirado / no autorizado → logout automático
    if (status === 401) {
      localStorage.removeItem('neonbench_token');
      localStorage.removeItem('neonbench_user');
      localStorage.removeItem('neonbench_session');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    // 400 — Error de validación Zod: adjuntar detalles de campo al error
    // Los formularios usan error.validationDetails para mostrar errores inline
    if (status === 400 && data?.detalles) {
      error.validationDetails = data.detalles; // Array de { campo, mensaje }
    }

    // Para todos los errores, normalizar el mensaje
    error.serverMessage =
      data?.error || data?.message || 'Error de conexión con el servidor';

    return Promise.reject(error);
  }
);

export default api;
