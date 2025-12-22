import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bus,
  Users,
  MapPin,
  LayoutDashboard,
  Handshake,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';
import api from '../services/api';

// NavigationModal removido, pois tudo ficará no BottomNav
import MobileBottomNav from './MobileBottomNav';

interface LayoutProps {
  currentUser: string | null;
  onLogout: () => void;
}

export default function Layout({ currentUser, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false); // Controla a expansão da barra

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Erro ao fazer logout no backend:', error);
    }
    onLogout();
  };

  const menuItems = [
    { path: '/trips', label: 'Viagens', icon: LayoutDashboard },
    { path: '/people', label: 'Pessoas', icon: Users },
    { path: '/fleet', label: 'Ônibus', icon: Bus },
    { path: '/addresses', label: 'Endereços', icon: MapPin },
    { path: '/affiliates', label: 'Afiliados', icon: Handshake },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      
      {/* --- TOP NAVIGATION BAR (Desktop) --- */}
      <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 pt-no-print relative z-10 hidden md:block">
        <div className="h-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src={logo} alt="Patricio Turismo" className="h-8 w-auto" />
            <nav className="flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Bem vindo,</p>
              <p className="text-sm font-medium leading-none">{currentUser || 'User'}</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HEADER MOBILE (Apenas Logo) */}
      <header className="md:hidden bg-white border-b border-slate-200 h-14 flex items-center justify-center sticky top-0 z-10 shadow-sm">
          <img src={logo} alt="Patricio Turismo" className="h-6 w-auto" />
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-auto bg-gray-50/50 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* --- BARRA DE NAVEGAÇÃO EXPANSÍVEL (MOBILE) --- */}
      <MobileBottomNav 
        isOpen={isNavOpen} 
        onToggleMenu={() => setIsNavOpen(!isNavOpen)} 
        onLogout={handleLogout}
      />
    </div>
  );
}