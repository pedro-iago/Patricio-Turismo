import React, { useState, useEffect } from 'react'; // Adicionar useEffect
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import TripsPage from './components/TripsPage';
import TripDetailsPage from './components/TripDetailsPage';
import PeoplePage from './components/PeoplePage';
import FleetPage from './components/FleetPage';
import AddressesPage from './components/AddressesPage';
// Importe a configuração do Axios que vamos criar
import { setupAxiosInterceptors } from './services/api'; 

export default function App() {
  // Inicializa o estado lendo o token do localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('authToken'));
  // Poderíamos guardar o username também, mas vamos simplificar por enquanto
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('username')); // Exemplo

  // Configura o Axios Interceptor quando o estado de autenticação muda
  useEffect(() => {
    setupAxiosInterceptors(handleLogout); // Passa handleLogout para o interceptor tratar 401
  }, []); // Executa apenas uma vez

   // Verifica o token no carregamento inicial
   useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username'); // Exemplo
    if (token) {
        setIsAuthenticated(true);
        setCurrentUser(storedUsername);
    } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
    }
  }, []); // Executa apenas uma vez no mount


  const handleLogin = (username: string, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('username', username); // Guarda o username também
    setIsAuthenticated(true);
    setCurrentUser(username);
    // Configura o interceptor DEPOIS de logar (caso não tenha sido configurado antes)
    setupAxiosInterceptors(handleLogout); 
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Idealmente, redirecionar para /login aqui, mas o Navigate fora do Route pode ser complexo.
    // O <Navigate> dentro das rotas já cuida disso se isAuthenticated for false.
    console.log("Logout realizado");
  };

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
          {/* Rotas protegidas dentro do Layout */}
          <Route index element={<Navigate to="/trips" replace />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:id" element={<TripDetailsPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="addresses" element={<AddressesPage />} />
        </Route>
        {/* Qualquer outra rota não definida redireciona para login se não autenticado */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/trips" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}