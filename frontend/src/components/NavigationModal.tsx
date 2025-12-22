import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'; 
import { LogOut } from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[]; // Recebe apenas os itens secundários
  onLogout: () => void;
}

export default function NavigationModal({
  isOpen,
  onClose,
  menuItems,
  onLogout,
}: NavigationModalProps) {
  
  const handleLogoutClick = () => {
    onClose(); 
    onLogout();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* MUDANÇA PRINCIPAL: side="bottom" */}
      <SheetContent 
        side="bottom" 
        className="rounded-t-[20px] px-4 pb-6 pt-2 outline-none" // Arredonda o topo
      >
        {/* Pequena "alça" visual para indicar que é arrastável */}
        <div className="mx-auto h-1 w-12 rounded-full bg-slate-200 mb-6" />

        <SheetHeader className="mb-4 text-left px-2">
          <SheetTitle className="text-lg font-bold text-slate-800">Mais opções</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-2 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose} 
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium text-slate-700 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 transition-colors active:scale-[0.98]"
              >
                <div className="p-2 bg-white rounded-full shadow-sm text-current">
                   <Icon className="w-5 h-5" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-4 border-t border-slate-100 px-2">
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 w-full transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}