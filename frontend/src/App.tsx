import React, { useState, useEffect, useCallback } from 'react'; // <-- IMPORTAR useEffect e useCallback
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import TripsPage from './components/TripsPage';
import TripDetailsPage from './components/TripDetailsPage';
import PeoplePage from './components/PeoplePage';
import FleetPage from './components/FleetPage';
import AddressesPage from './components/AddressesPage';
import api from './services/api'; 

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
    (async () => {
      try {
        const response = await api.get('/api/me');
        
        handleLogin(response.data); 
      } catch (error) {
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [handleLogin, handleLogout]); 

  if (isLoading) {
    return <div>Carregando...</div>; 
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
          <Route path="people" element={<PeoplePage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="addresses" element={<AddressesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}