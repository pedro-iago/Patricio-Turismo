import axios from 'axios';

// Detecta automaticamente se estamos em modo de desenvolvimento (npm run dev)
const isDevelopment = import.meta.env.DEV;

/**
 * Se estiver em desenvolvimento, aponta para o backend do Spring Boot (porta 8081).
 * Se estiver em produção (build), usa um caminho relativo (vazio) 
 * pois o backend e o frontend estarão no mesmo servidor (Render).
 */
const API_BASE_URL = isDevelopment ? "http://localhost:8080" : ""; 

// O resto do seu arquivo continua igual
const api = axios.create({
  baseURL: API_BASE_URL, 
  withCredentials: true
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Sessão expirada ou acesso negado. Redirecionando para login...');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;