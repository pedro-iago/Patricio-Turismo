import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, Users, MapPin, Truck, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import logo from '../assets/logo.png';
import api from '@/services/api'; // <-- 1. IMPORTE O 'api'

interface LayoutProps {
  currentUser: string | null;
  onLogout: () => void;
}

export default function Layout({ currentUser, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // --- 2. ESTA É A FUNÇÃO CORRIGIDA ---
  // Ela agora é 'async' e chama o 'api.post'
  const handleLogout = async () => {
    try {
      // 3. Chama o endpoint /logout do backend
      // Isso vai destruir o HttpOnly cookie
      await api.post('/logout');
      
    } catch (error) {
      // Mesmo se falhar, continua o logout no frontend
      console.error("Erro ao fazer logout no backend:", error);
    }

    // 4. Chama a função do App.tsx para limpar o estado do React
    onLogout();
    
    // 5. O 'navigate' não é mais necessário, pois o App.tsx
    // já vai te redirecionar para /login quando o estado mudar.
  };
  // --- FIM DA MUDANÇA ---


  const menuItems = [
    { path: '/trips', label: 'Viagens', icon: LayoutDashboard },
    { path: '/people', label: 'Pessoas', icon: Users },
    { path: '/fleet', label: 'Onibus', icon: Bus },
    { path: '/addresses', label: 'Endereço', icon: MapPin },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div>
             <img src={logo} alt="Logo da Empresa" className="h-11 w-auto" />
            </div>
          </div>
        </div>

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

        <div className="p-4 border-t border-sidebar-border">
          {/* Este botão agora chama a função async correta */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-foreground">
              {menuItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-muted-foreground">Bem Vindo, </p>
              <p className="text-foreground">{currentUser || 'User'}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}