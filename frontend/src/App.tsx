import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import TripsPage from './components/TripsPage';
import TripDetailsPage from './components/TripDetailsPage';
import PeoplePage from './components/PeoplePage';
import FleetPage from './components/FleetPage';
import AddressesPage from './components/AddressesPage';
import api from './services/api';
import AffiliatesPage from './components/AffiliatesPage';
import PrintReportPage from './components/PrintReportPage';
import TaxistaDetailsPage from './components/TaxistaDetailsPage';
import ComisseiroDetailsPage from './components/ComisseiroDetailsPage';
import PassListTripPage from './components/PassListTripPage';
import PessoaDetailsPage from './components/PessoaDetailsPage';

// --- 1. Importe a nova página de relatório ---
import TaxistaReportPage from './components/TaxistaReportPage';

// Se quiser usar o logo na tela de carregamento, descomente a linha abaixo e ajuste o caminho
// import logo from './assets/logo.png'; 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = useCallback((username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true; // Flag para evitar atualização de estado em componente desmontado

    const checkAuth = async () => {
      try {
        const response = await api.get('/api/me');
        if (isMounted) {
          handleLogin(response.data);
        }
      } catch (error) {
        if (isMounted) {
          handleLogout();
        }
      } finally {
        if (isMounted) {
          // Pequeno delay (500ms) para evitar que a tela pisque muito rápido (flicker)
          // e garantir uma transição suave da cor do manifest para o app.
          setTimeout(() => setIsLoading(false), 500);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [handleLogin, handleLogout]);

  // === TELA DE CARREGAMENTO (SPLASH SCREEN) ===
  // Fundo laranja (#F7931E) para combinar com o Manifest e o body do HTML
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7931E]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          {/* Spinner Branco */}
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          
          {/* Texto Branco */}
          <span className="text-white font-bold text-lg tracking-wide">
            CARREGANDO...
          </span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/trips" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        {/* --- ROTAS DENTRO DO LAYOUT PRINCIPAL --- */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/trips" replace />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:id" element={<TripDetailsPage />} />
          
          {/* Rota de passar lista */}
          <Route path="trips/:id/passar-lista" element={<PassListTripPage />} />
          
          <Route path="people" element={<PeoplePage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="affiliates" element={<AffiliatesPage />} />
          
          <Route path="taxistas/:id" element={<TaxistaDetailsPage />} />
          <Route path="comisseiros/:id" element={<ComisseiroDetailsPage />} />
          <Route path="pessoas/:id" element={<PessoaDetailsPage />} />
        </Route>

        {/* --- ROTAS DE IMPRESSÃO (SEM LAYOUT) --- */}
        <Route
          path="/trips/:id/print"
          element={
            isAuthenticated ? (
              <PrintReportPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* --- 2. Nova Rota de Relatório PDF por Taxista --- */}
        <Route
          path="/trips/:id/relatorio-taxistas"
          element={
            isAuthenticated ? (
              <TaxistaReportPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}