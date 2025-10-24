import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, Users, MapPin, Truck, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  currentUser: string | null;
  onLogout: () => void;
}

export default function Layout({ currentUser, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/trips', label: 'Trips', icon: LayoutDashboard },
    { path: '/people', label: 'People', icon: Users },
    { path: '/fleet', label: 'Fleet', icon: Bus },
    { path: '/addresses', label: 'Addresses', icon: MapPin },
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
            <div className="bg-primary rounded-lg p-2">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-primary">TransportPro</h2>
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
              <p className="text-muted-foreground">Welcome back,</p>
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
