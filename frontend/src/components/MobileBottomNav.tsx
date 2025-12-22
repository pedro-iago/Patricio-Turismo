import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bus, 
  ChevronUp, 
  MapPin, 
  Handshake, 
  LogOut 
} from 'lucide-react';
import { cn } from './ui/utils';

interface MobileBottomNavProps {
  isOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
}

export default function MobileBottomNav({ isOpen, onToggleMenu, onLogout }: MobileBottomNavProps) {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route: string) => {
    return path === route || path.startsWith(route + '/');
  };

  // Itens da barra principal (Sempre visíveis)
  const mainItems = [
    { label: 'Viagens', path: '/trips', icon: LayoutDashboard },
    { label: 'Pessoas', path: '/people', icon: Users },
    { label: 'Frota', path: '/fleet', icon: Bus },
  ];

  // Itens do menu expandido (Aparecem ao subir)
  const secondaryItems = [
    { label: 'Endereços', path: '/addresses', icon: MapPin },
    { label: 'Afiliados', path: '/affiliates', icon: Handshake },
  ];

  return (
    <>
      {/* Overlay escuro (Opcional: clica fora para fechar) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-40 animate-in fade-in"
          onClick={onToggleMenu}
        />
      )}

      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out pb-safe",
        // Se estiver aberto, adicionamos padding-bottom extra se necessário, ou controlamos pela altura do conteúdo
      )}>
        
        {/* --- CONTEÚDO EXPANDIDO (SECUNDÁRIO) --- */}
        <div 
          className={cn(
            "grid grid-cols-3 gap-4 px-4 overflow-hidden transition-all duration-300 ease-in-out bg-slate-50/50",
            isOpen ? "max-h-40 py-6 border-b border-slate-100 opacity-100" : "max-h-0 py-0 opacity-0"
          )}
        >
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={onToggleMenu}
                className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
              >
                <div className={cn(
                  "p-3 rounded-2xl shadow-sm border transition-colors", 
                  active ? "bg-orange-100 border-orange-200 text-orange-600" : "bg-white border-slate-200 text-slate-500"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-600">{item.label}</span>
              </Link>
            );
          })}

          {/* Botão de Logout no Menu Expandido */}
          <button 
            onClick={() => { onToggleMenu(); onLogout(); }}
            className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
          >
            <div className="p-3 rounded-2xl shadow-sm border bg-white border-red-100 text-red-500">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-red-500">Sair</span>
          </button>
        </div>

        {/* --- BARRA PRINCIPAL (FIXA) --- */}
        <div className="grid grid-cols-4 h-16 bg-white relative z-10">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => isOpen && onToggleMenu()} // Fecha se clicar num item principal
                className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
              >
                <div className={cn(
                  "p-1 rounded-xl transition-colors", 
                  active ? "bg-orange-100 text-orange-600" : "text-slate-400"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-none", 
                  active ? "text-orange-700" : "text-slate-500"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Botão "Mais" (Expandir/Recolher) */}
          <button 
            onClick={onToggleMenu} 
            className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <div className={cn(
              "p-1 rounded-xl text-slate-400 transition-all duration-300", 
              isOpen ? "bg-slate-100 text-slate-600 rotate-180" : ""
            )}>
              {/* Seta aponta para cima (padrão) e gira 180 (para baixo) quando aberto */}
              <ChevronUp className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium leading-none transition-colors",
              isOpen ? "text-slate-600" : "text-slate-500"
            )}>
              {isOpen ? 'Menos' : 'Mais'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}