import axios from 'axios';

const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? "http://localhost:8080" : "";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Sessão expirada ou acesso negado. Redirecionando para login...');

      // Detecta se o usuário está em um dispositivo iOS (iPhone/iPad)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      if (isIOS) {
        // No iOS, apenas limpamos o estado. O App.tsx detectará a falta do user e mostrará o Login
        // sem disparar o window.location.href, o que impede as abas do Safari de aparecerem.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Opcional: Recarregar apenas se não estiver na página de login, mas via React Router
        // Se o seu App.tsx já reage ao localStorage, não precisa de mais nada aqui.
      } else {
        // Mantém o comportamento original para Android e Desktop
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// === TIPOS NOVOS PARA O MAPA ===
export interface SeatLayout {
  numero: string | null;
  tipo: 'JANELA' | 'CORREDOR' | 'VAZIO';
  ocupado: boolean;
}

// === FUNÇÕES DE ÔNIBUS ===
export const getOnibusLayout = async (id: number): Promise<SeatLayout[][]> => {
  const response = await api.get(`/api/onibus/${id}/layout`);
  return response.data;
};

// === FUNÇÕES DE RELATÓRIO (MANTIDAS) ===
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