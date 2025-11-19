import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bus,
  Users,
  MapPin,
  LayoutDashboard,
  Handshake,
  Menu,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';
import api from '@/services/api';

import NavigationModal from './NavigationModal';

interface LayoutProps {
  currentUser: string | null;
  onLogout: () => void;
}

export default function Layout({ currentUser, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

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
      
      {/* --- TOP NAVIGATION BAR --- */}
      <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 pt-no-print">
        <div className="h-full px-4 md:px-8 flex items-center justify-between">
          
          {/* LADO ESQUERDO: Logo e Menu Desktop */}
          <div className="flex items-center gap-8">
            
            {/* Botão Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setIsNavModalOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <img src={logo} alt="Patricio Turismo" className="h-8 w-auto" />

            {/* Menu Desktop (Links horizontais) */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${active 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* LADO DIREITO: Usuário e Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs text-muted-foreground">Bem vindo,</p>
              <p className="text-sm font-medium leading-none">{currentUser || 'User'}</p>
            </div>
            
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-auto bg-gray-50/50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto"> {/* Container centralizado para telas ultrawide */}
          <Outlet />
        </div>
      </main>

      {/* MODAL DE NAVEGAÇÃO (Mobile) */}
      <NavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        menuItems={menuItems}
        onLogout={handleLogout}
      />
    </div>
  );
}