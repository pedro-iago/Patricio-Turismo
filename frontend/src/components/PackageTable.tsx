import React, { useMemo } from 'react';
import { Button } from './ui/button';
import { Edit, Trash2, DollarSign, Palette, Package, Phone } from 'lucide-react';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import api from '../services/api';
import { TAG_COLORS } from '../constants'; 
import { cn } from './ui/utils';

// --- Interfaces ---
interface Person { 
    id: number; 
    nome: string; 
    telefones?: string[]; 
    telefone?: string | null; 
}
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

interface PackageData {
  id: number;
  descricao: string;
  remetente: Person;
  destinatario: Person;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
  corTag?: string;
  cor?: string; 
  [key: string]: any;
}

interface PackageTableProps {
  packages: PackageData[];
  loading: boolean;
  isPrintView?: boolean;
  onMarkAsPaid?: (id: number) => void;
  onEdit?: (pkg: PackageData) => void;
  onDelete?: (pkg: PackageData) => void;
  onRefreshData?: () => void;
}

// --- UTILS ---
const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPhones = (p: Person) => {
    if (p.telefones && p.telefones.length > 0) return p.telefones.join(' / ');
    if (p.telefone) return p.telefone;
    return 'S/ Tel';
};

const formatAddress = (addr?: Address) => {
  if (!addr) return 'Não informado';
  return `${addr.logradouro || ''}, ${addr.numero || ''} - ${addr.bairro || ''} - ${addr.cidade || ''}`;
};

// --- COMPONENTES VISUAIS ---

const PackageVisualItem = ({ 
    pkg, 
    onMarkAsPaid, 
    onEdit, 
    onDelete, 
    handleColorChange 
}: { 
    pkg: PackageData, 
    onMarkAsPaid?: (id: number) => void,
    onEdit?: (pkg: PackageData) => void,
    onDelete?: (pkg: PackageData) => void,
    handleColorChange: (id: number, color: string | null) => void
}) => {
    const displayColor = pkg.corTag || pkg.cor || 'transparent';
    const isPaid = pkg.pago;
    const hasColor = displayColor !== 'transparent';

    // Estilos do Card (Faixa Lateral)
    const tagStyle = {
        backgroundColor: displayColor,
        width: hasColor ? '6px' : '0px',
        borderTopLeftRadius: '6px',
        borderBottomLeftRadius: '6px',
    };

    return (
        <div className="relative flex items-stretch border border-slate-200 rounded-md mb-2 bg-white transition-all hover:shadow-sm">
            {/* 1. Faixa Colorida Lateral (Esquerda) */}
            <div style={tagStyle} className="flex-shrink-0 transition-all duration-300"></div>
            
            <div className="flex-1 flex items-center gap-2 py-3 px-3 overflow-hidden">
                {/* Ícone de Pacote */}
                <div className="text-slate-300 flex-shrink-0 self-center">
                    <Package className="w-5 h-5" />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-center min-w-0">
                    
                    {/* COLUNA 1: Descrição e Pessoas */}
                    <div className="md:col-span-4 flex flex-col overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-950 text-base uppercase truncate leading-snug" title={pkg.descricao}>
                                {pkg.descricao}
                            </span>
                            {/* 2. Bolinha Colorida (Visual Adicional) */}
                            {hasColor && (
                                <div 
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-black/5" 
                                    style={{ backgroundColor: displayColor }} 
                                    title="Cor da Tag"
                                />
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-slate-600">
                            <div className="truncate flex items-center gap-1">
                                <strong className="text-slate-800">De:</strong> {pkg.remetente.nome} <span className="text-[10px] text-slate-400">({formatPhones(pkg.remetente)})</span>
                            </div>
                            <div className="truncate flex items-center gap-1">
                                <strong className="text-slate-800">Para:</strong> {pkg.destinatario.nome} <span className="text-[10px] text-slate-400">({formatPhones(pkg.destinatario)})</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 2: Endereços */}
                    <div className="md:col-span-4 flex flex-col gap-1.5 text-xs border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 pl-0 md:pl-3 overflow-hidden">
                        <div className="flex items-start gap-1">
                            <span className="font-bold text-slate-900 w-3 shrink-0">C:</span>
                            <span className="text-slate-800 leading-tight truncate font-medium" title={formatAddress(pkg.enderecoColeta)}>
                                {formatAddress(pkg.enderecoColeta)}
                            </span>
                        </div>
                        <div className="flex items-start gap-1">
                            <span className="font-bold text-slate-900 w-3 shrink-0">E:</span>
                            <span className="text-slate-800 leading-tight truncate font-medium" title={formatAddress(pkg.enderecoEntrega)}>
                                {formatAddress(pkg.enderecoEntrega)}
                            </span>
                        </div>
                    </div>

                    {/* COLUNA 3: Afiliados e Valor */}
                    <div className="md:col-span-2 flex flex-col md:flex-col sm:flex-row sm:justify-between md:justify-center gap-1 text-xs border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 pl-0 md:pl-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-slate-600 text-[10px] truncate" title={`TC: ${pkg.taxistaColeta?.pessoa?.nome}`}>TC: <span className="text-slate-800 font-bold">{pkg.taxistaColeta?.pessoa?.nome?.split(' ')[0] || '-'}</span></span>
                            <span className="text-slate-600 text-[10px] truncate" title={`TE: ${pkg.taxistaEntrega?.pessoa?.nome}`}>TE: <span className="text-slate-800 font-bold">{pkg.taxistaEntrega?.pessoa?.nome?.split(' ')[0] || '-'}</span></span>
                            <span className="text-slate-600 text-[10px] truncate" title={`C: ${pkg.comisseiro?.pessoa?.nome}`}>C: <span className="text-slate-800 font-bold">{pkg.comisseiro?.pessoa?.nome?.split(' ')[0] || '-'}</span></span>
                        </div>
                        <div className="border-t border-slate-200 mt-1.5 pt-1 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-2 md:border-l-0 md:pl-0 md:border-t md:pt-1">
                            <span className="font-black text-slate-900 text-xs">{formatCurrency(pkg.valor)}</span>
                        </div>
                    </div>

                    {/* COLUNA 4: Ações e Status */}
                    <div className="md:col-span-2 flex flex-col items-end gap-2 pl-1 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                        <div className="flex items-center gap-2 justify-end w-full">
                            <Badge variant="outline" className={cn("text-[10px] h-5 px-2 font-bold border-0", isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800")}>
                                {isPaid ? "Pago" : "Pendente"}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="p-1.5 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
                                        <Palette className="w-4 h-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-3 grid grid-cols-8 gap-2 shadow-xl bg-white border-slate-200" align="end">
                                    {TAG_COLORS.map(c => (
                                        <button 
                                            key={c.hex} 
                                            title={c.label} 
                                            className="w-6 h-6 rounded-full border border-slate-300 hover:scale-125 transition-all" 
                                            style={{backgroundColor: c.hex}} 
                                            onClick={(e) => { e.stopPropagation(); handleColorChange(pkg.id, c.hex); }} 
                                        />
                                    ))}
                                    <button className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-xs text-slate-500 hover:bg-red-50 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleColorChange(pkg.id, null); }}>X</button>
                                </PopoverContent>
                            </Popover>

                            <button onClick={(e) => { e.stopPropagation(); onMarkAsPaid && onMarkAsPaid(pkg.id); }} className={cn("p-1.5 rounded transition-colors", isPaid ? 'text-slate-300' : 'text-slate-400 hover:text-green-600 hover:bg-green-50')}>
                                <DollarSign className="w-4 h-4" />
                            </button>
                            
                            <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(pkg); }} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <Edit className="w-4 h-4" />
                            </button>
                            
                            <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(pkg); }} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. Container da Cidade (O container cinza)
const PackageCityContainer = ({ 
    cityName, 
    packages, 
    ...props 
}: { 
    cityName: string, 
    packages: PackageData[],
    onMarkAsPaid?: (id: number) => void,
    onEdit?: (pkg: PackageData) => void,
    onDelete?: (pkg: PackageData) => void,
    handleColorChange: (id: number, color: string | null) => void;
}) => {
    return (
        <div className="p-4 rounded-xl border mb-6 bg-slate-100/50 border-slate-200 shadow-sm">
            <div className="mb-4 flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full shadow-sm"></div>
                    <h2 className="font-black text-lg text-slate-800 uppercase tracking-wide">{cityName}</h2>
                    <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                        {packages.length}
                    </span>
                </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-2 bg-slate-50/50">
                <div className="flex flex-col min-h-[10px]">
                    {packages.map(pkg => (
                        <PackageVisualItem key={pkg.id} pkg={pkg} {...props} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function PackageTable({
  packages,
  loading,
  isPrintView = false,
  onMarkAsPaid,
  onEdit,
  onDelete,
  onRefreshData,
}: PackageTableProps) {
  
  const handleColorChange = async (packageId: number, color: string | null) => {
    try {
        await api.patch(`/api/encomenda/${packageId}/cor`, { cor: color }); 
        if (onRefreshData) onRefreshData(); else window.location.reload(); 
    } catch (error) {
        console.error("Erro ao salvar cor:", error);
    }
  };

  const groupedData = useMemo(() => {
      const groups: Record<string, PackageData[]> = {};
      
      packages.forEach(pkg => {
          const cityKey = pkg.enderecoColeta?.cidade || 'Geral / Sem Cidade';
          if (!groups[cityKey]) {
              groups[cityKey] = [];
          }
          groups[cityKey].push(pkg);
      });

      return Object.keys(groups).sort().map(city => ({
          city,
          items: groups[city]
      }));
  }, [packages]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando encomendas...</div>;
  if (!packages || packages.length === 0) return <div className="text-center py-8 text-muted-foreground">Nenhuma encomenda encontrada</div>;

  return (
    <div className="flex flex-col">
        {groupedData.map((group) => (
            <PackageCityContainer 
                key={group.city}
                cityName={group.city}
                packages={group.items}
                onMarkAsPaid={onMarkAsPaid}
                onEdit={onEdit}
                onDelete={onDelete}
                handleColorChange={handleColorChange}
            />
        ))}
    </div>
  );
}