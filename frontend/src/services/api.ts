import axios from 'axios';


const API_BASE_URL = ""; 


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
