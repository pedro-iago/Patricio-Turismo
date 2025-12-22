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
import TaxistaReportPage from './components/TaxistaReportPage';

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
    let isMounted = true;

    // Timeout de segurança: Se travar, libera em 3s
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("API demorou. Liberando acesso.");
        setIsLoading(false);
      }
    }, 3000);

    const checkAuth = async () => {
      try {
        const response = await api.get('/api/me', { timeout: 5000 });
        if (isMounted) {
          handleLogin(response.data);
        }
      } catch (error) {
        if (isMounted) {
          handleLogout();
        }
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeout);
          // Remove o loading imediatamente
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [handleLogin, handleLogout]);

  // TELA DE LOADING (Igual ao fundo do body)
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7931E]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <span className="text-white font-bold text-lg tracking-wide">
            CARREGANDO...
          </span>
          {/* Indicador para sabermos se o iPhone atualizou o cache */}
          <span className="text-white/60 text-xs font-mono">v3.0</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={ isAuthenticated ? <Navigate to="/trips" replace /> : <LoginPage onLogin={handleLogin} /> }
        />
        
        <Route
          path="/"
          element={ isAuthenticated ? <Layout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace /> }
        >
          <Route index element={<Navigate to="/trips" replace />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:id" element={<TripDetailsPage />} />
          <Route path="trips/:id/passar-lista" element={<PassListTripPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="affiliates" element={<AffiliatesPage />} />
          <Route path="taxistas/:id" element={<TaxistaDetailsPage />} />
          <Route path="comisseiros/:id" element={<ComisseiroDetailsPage />} />
          <Route path="pessoas/:id" element={<PessoaDetailsPage />} />
          <Route path="trips/:id/relatorio-taxistas" element={<TaxistaReportPage />} />
        </Route>

        <Route path="/trips/:id/print" element={isAuthenticated ? <PrintReportPage /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}