import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet'; 
import logo from '../assets/logo.png';
import { LogOut } from 'lucide-react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
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
      <SheetContent 
        side="left" 
        // --- ADICIONE ESTAS CLASSES TAILWIND ---
        className="flex flex-col h-full w-[280px] sm:w-[300px] 
                   transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full"
        // ------------------------------------
      >
        <SheetHeader className="border-b pb-4">
          <SheetTitle>
            <img src={logo} alt="Logo" className="h-10 w-auto" />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu de navegação principal
          </SheetDescription>
        </SheetHeader>

        <nav className="flex-1 flex flex-col py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose} 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-lg text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-4">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-lg text-destructive hover:bg-destructive/10 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}