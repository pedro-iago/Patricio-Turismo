import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bus,
  Users,
  MapPin,
  Truck,
  LogOut,
  LayoutDashboard,
  Handshake,
  Menu,
} from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';
import api from '@/services/api';

import { useMobile } from './ui/use-mobile';
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
    { path: '/fleet', label: 'Onibus', icon: Bus },
    { path: '/addresses', label: 'Endereço', icon: MapPin },
    { path: '/affiliates', label: 'Afiliados', icon: Handshake },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const currentPageTitle =
    menuItems.find((item) => isActive(item.path))?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-background">
      {/* 1. CLASSE ATUALIZADA AQUI */}
      <aside className="w-64 bg-white border-r border-sidebar-border hidden md:flex md:flex-col pt-no-print">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div>
              <img src={logo} alt="Logo da Empresa" className="h-11 w-auto" />
            </div>
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-accent text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Botão Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. CLASSE ATUALIZADA AQUI */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between pt-no-print">
          <div className="flex items-center gap-3">
            {/* BOTÃO DE MENU (HAMBÚRGUER) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsNavModalOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <h1 className="text-xl font-semibold text-foreground">
              {currentPageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Bem Vindo,</p>
              <p className="text-sm font-medium text-foreground">
                {currentUser || 'User'}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>

      {/* MODAL DE NAVEGAÇÃO */}
      <NavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        menuItems={menuItems}
        onLogout={handleLogout}
      />
    </div>
  );
}