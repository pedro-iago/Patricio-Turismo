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
      console.error('Sessão expirada ou acesso negado.');

      // 1. SEGURANÇA: Limpa os dados sensíveis localmente independente do sistema
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 2. DETECÇÃO DE DISPOSITIVO: Identifica se é iOS (iPhone/iPad)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

      if (isIOS) {
        // No iOS, evitamos o window.location.href para as abas do Safari não aparecerem.
        // Como o localStorage foi limpo acima, o App.tsx (que você enviou) detectará 
        // a mudança de estado e renderizará o <LoginPage /> automaticamente.
      } else {
        // SEGURANÇA REFORÇADA (Android/Windows): Força o redirecionamento bruto da página
        // para garantir que nenhum estado residual permaneça na memória.
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

// Busca o desenho (layout) do ônibus
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