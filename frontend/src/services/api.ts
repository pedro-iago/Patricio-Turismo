import axios from 'axios';

// Interfaces (mantidas do seu arquivo original)
export interface SeatLayout {
  numero: string | null;
  tipo: 'JANELA' | 'CORREDOR' | 'VAZIO';
  ocupado: boolean;
}

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? "http://localhost:8080" : "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se der 401/403 (Sessão inválida)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Sessão expirada. O App deve tratar o logout via estado.');
      
      // === CORREÇÃO IOS PWA ===
      // COMENTADO para não forçar reload de página e abrir o Safari
      /*
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      */
    }
    return Promise.reject(error);
  }
);

// === FUNÇÕES DE ÔNIBUS ===
export const getOnibusLayout = async (id: number): Promise<SeatLayout[][]> => {
  const response = await api.get(`/api/onibus/${id}/layout`);
  return response.data;
};

// === FUNÇÕES DE RELATÓRIO ===
const REPORT_API_URL = '/api/v1/reports';
const buildDateParams = (inicio: string, fim: string) => new URLSearchParams({ inicio, fim }).toString();

export const getTaxistaPassageirosReport = async (taxistaId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(`${REPORT_API_URL}/taxista/${taxistaId}/passageiros?${params}`);
  return response.data;
};

export const getTaxistaEncomendasReport = async (taxistaId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(`${REPORT_API_URL}/taxista/${taxistaId}/encomendas?${params}`);
  return response.data;
};

export const getComisseiroPassageirosReport = async (comisseiroId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(`${REPORT_API_URL}/comisseiro/${comisseiroId}/passageiros?${params}`);
  return response.data;
};

export const getComisseiroEncomendasReport = async (comisseiroId: string, inicio: string, fim: string) => {
  const params = buildDateParams(inicio, fim);
  const response = await api.get(`${REPORT_API_URL}/comisseiro/${comisseiroId}/encomendas?${params}`);
  return response.data;
};

export const getPessoaPassageiroReport = async (pessoaId: string) => {
  const response = await api.get(`${REPORT_API_URL}/pessoa/${pessoaId}/passageiros`);
  return response.data;
};

export const getPessoaEncomendasEnviadas = async (pessoaId: string) => {
  const response = await api.get(`${REPORT_API_URL}/pessoa/${pessoaId}/encomendas/enviadas`);
  return response.data;
};

export const getPessoaEncomendasRecebidas = async (pessoaId: string) => {
  const response = await api.get(`${REPORT_API_URL}/pessoa/${pessoaId}/encomendas/recebidas`);
  return response.data;
};

export default api;