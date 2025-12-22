import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bus,
  Users,
  MapPin,
  LayoutDashboard,
  Handshake,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';
import api from '../services/api';
import MobileBottomNav from './MobileBottomNav';

interface LayoutProps {
  currentUser: string | null;
  onLogout: () => void;
}

export default function Layout({ currentUser, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

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
    // [CORREÇÃO CRÍTICA AQUI]
    // Mudamos de 'h-screen' para 'fixed inset-0'.
    // Isso prende o layout nas bordas físicas do celular, impedindo o Safari de empurrar.
    <div className="fixed inset-0 flex flex-col w-full h-full bg-gray-50 overflow-hidden">
      
      {/* HEADER DESKTOP */}
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
      <header className="md:hidden bg-white border-b border-slate-200 h-14 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
          <img src={logo} alt="Patricio Turismo" className="h-6 w-auto" />
      </header>

      {/* [CORREÇÃO CRÍTICA AQUI TAMBÉM] */}
      {/* Adicionamos 'overflow-y-auto' AQUI. */}
      {/* Isso cria uma "janela de rolagem" interna, enquanto o corpo do site fica travado. */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:pb-8 overscroll-contain">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* BARRA INFERIOR MOBILE */}
      <MobileBottomNav 
        isOpen={isNavOpen} 
        onToggleMenu={() => setIsNavOpen(!isNavOpen)} 
        onLogout={handleLogout}
      />
    </div>
  );
}