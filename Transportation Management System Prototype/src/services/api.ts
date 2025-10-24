import axios from 'axios';

// URL base da sua API
const API_URL = 'http://localhost:8080';

// Cria uma instância do Axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função para configurar os interceptors
export const setupAxiosInterceptors = (onUnauthenticated: () => void) => {
  
  // Interceptor de Requisição: Adiciona o token ao cabeçalho
  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // console.log('Interceptor: Adicionando token:', token); // Debug
      } else {
         // console.log('Interceptor: Sem token no localStorage.'); // Debug
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de Resposta: Trata erros 401 (Não autorizado)
  apiClient.interceptors.response.use(
    (response) => {
      // Qualquer status code que caia no range de 2xx causa essa função trigger
      return response;
    },
    (error) => {
      // Qualquer status code fora do range de 2xx causa essa função trigger
       // console.error('Interceptor: Erro na resposta:', error.response); // Debug
      if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
        console.warn('Interceptor: Recebido 401 Unauthorized. Deslogando...');
        // Token inválido ou expirado, chama a função de logout passada pelo App.tsx
        onUnauthenticated(); 
      }
      return Promise.reject(error);
    }
  );
};


// Exporta a instância configurada para ser usada nos componentes
export default apiClient;