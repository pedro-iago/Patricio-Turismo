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

// === FUNÇÕES DE RELATÓRIO DE AFILIADOS ===

// URL base do ReportController
const REPORT_API_URL = '/api/v1/reports';

// Helper para formatar os parâmetros de data (ISO String: YYYY-MM-DDTHH:MM:SS)
const buildDateParams = (inicio: string, fim: string) => {
  return new URLSearchParams({ inicio, fim }).toString();
};

// --- Funções de Relatório para Taxista ---

export const getTaxistaPassageirosReport = async (taxistaId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(
    `${REPORT_API_URL}/taxista/${taxistaId}/passageiros?${params}`
  );
  return response.data;
};

export const getTaxistaEncomendasReport = async (taxistaId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(
    `${REPORT_API_URL}/taxista/${taxistaId}/encomendas?${params}`
  );
  return response.data;
};

// --- Funções de Relatório para Comissário ---

export const getComisseiroPassageirosReport = async (comisseiroId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(
    `${REPORT_API_URL}/comisseiro/${comisseiroId}/passageiros?${params}`
  );
  return response.data;
};

export const getComisseiroEncomendasReport = async (comisseiroId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(
    `${REPORT_API_URL}/comisseiro/${comisseiroId}/encomendas?${params}`
  );
  return response.data;
};

// === NOVAS FUNÇÕES DE HISTÓRICO DA PESSOA ===

export const getPessoaPassageiroReport = async (pessoaId: string) => {
  const response = await api.get(
    `${REPORT_API_URL}/pessoa/${pessoaId}/passageiros`
  );
  return response.data;
};

export const getPessoaEncomendasEnviadas = async (pessoaId: string) => {
  const response = await api.get(
    `${REPORT_API_URL}/pessoa/${pessoaId}/encomendas/enviadas`
  );
  return response.data;
};

export const getPessoaEncomendasRecebidas = async (pessoaId: string) => {
  const response = await api.get(
    `${REPORT_API_URL}/pessoa/${pessoaId}/encomendas/recebidas`
  );
  return response.data;
};


export default api;