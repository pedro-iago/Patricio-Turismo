import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, DollarSign, Palette, Package, Phone } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import api from '../services/api';

// --- Interfaces ---
interface Person { id: number; nome: string; telefone?: string | null; }
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

const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- Helper para endereço ---
const formatAddress = (addr?: Address) => {
  if (!addr) return <span className="text-gray-400 italic">Não informado</span>;
  return `${addr.logradouro || ''}, ${addr.numero || ''} - ${addr.bairro || ''}, ${addr.cidade || ''}`;
};

// --- NOVA PALETA DE CORES EXPANDIDA ---
const TAG_COLORS = [
  { hex: '#ef4444', label: 'Vermelho' },
  { hex: '#f97316', label: 'Laranja' },
  { hex: '#f59e0b', label: 'Âmbar' },
  { hex: '#eab308', label: 'Amarelo' },
  { hex: '#84cc16', label: 'Lima' },
  { hex: '#22c55e', label: 'Verde' },
  { hex: '#10b981', label: 'Esmeralda' },
  { hex: '#06b6d4', label: 'Ciano' },
  { hex: '#3b82f6', label: 'Azul' },
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#8b5cf6', label: 'Violeta' },
  { hex: '#a855f7', label: 'Roxo' },
  { hex: '#d946ef', label: 'Fúcsia' },
  { hex: '#ec4899', label: 'Rosa' },
  { hex: '#f43f5e', label: 'Rose' },
  { hex: '#78350f', label: 'Marrom' },
  { hex: '#64748b', label: 'Cinza' },
  { hex: '#18181b', label: 'Preto' },
];

interface PackageTableProps {
  packages: PackageData[];
  loading: boolean;
  isPrintView?: boolean;
  onMarkAsPaid?: (id: number) => void;
  onEdit?: (pkg: PackageData) => void;
  onDelete?: (pkg: PackageData) => void;
  onRefreshData?: () => void;
}

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

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando encomendas...</div>;
  if (!packages || packages.length === 0) return <div className="text-center py-8 text-muted-foreground">Nenhuma encomenda encontrada</div>;

  return (
    <>
    {/* --- VERSÃO DESKTOP (TABELA) --- */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="pt-print-col-descricao">Descrição</TableHead>
            <TableHead className="pt-print-col-remetente">Remetente / Destinatário</TableHead>
            <TableHead className="pt-print-col-afiliado">Afiliados</TableHead>
            <TableHead className="pt-print-col-valor">Valor</TableHead>
            <TableHead className="pt-print-col-status">Status</TableHead>
            {!isPrintView && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
            {packages.map((pkg, index) => {
              const displayColor = pkg.corTag || pkg.cor || 'transparent';
              return (
              <TableRow key={pkg.id} className="group">
                 <TableCell className="p-2 text-center relative">
                   <span className="relative z-10 font-bold text-xs text-gray-600">{index + 1}</span>
                   <div className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r-md" style={{ backgroundColor: displayColor, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
                   {!isPrintView && (
                       <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80">
                         <Popover>
                             <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Palette className="w-3 h-3 text-gray-500" /></Button></PopoverTrigger>
                             <PopoverContent className="w-auto p-2 grid grid-cols-5 gap-2 z-50">
                                 {TAG_COLORS.map(c => (<button key={c.hex} className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform" style={{ backgroundColor: c.hex }} onClick={() => handleColorChange(pkg.id, c.hex)} title={c.label} />))}
                                 <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 hover:bg-gray-100" onClick={() => handleColorChange(pkg.id, null)}>X</button>
                             </PopoverContent>
                         </Popover>
                       </div>
                   )}
                </TableCell>
                <TableCell className="font-medium">{pkg.descricao}</TableCell>
                <TableCell>
                  <div className="text-xs"><b>De:</b> {pkg.remetente.nome} {pkg.remetente.telefone && <span className="text-gray-500 font-mono ml-1">({pkg.remetente.telefone})</span>}</div>
                  <div className="text-xs mt-1"><b>Para:</b> {pkg.destinatario.nome} {pkg.destinatario.telefone && <span className="text-gray-500 font-mono ml-1">({pkg.destinatario.telefone})</span>}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs"><b>TC:</b> {pkg.taxistaColeta?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>TE:</b> {pkg.taxistaEntrega?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>C:</b> {pkg.comisseiro?.pessoa.nome || '-'}</div>
                </TableCell>
                <TableCell>{formatCurrency(pkg.valor)}</TableCell>
                <TableCell>
                  {pkg.pago ? (<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 print:border-0">Pago</span>) : (<span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 print:border-0">Pendente</span>)}
                </TableCell>
                {!isPrintView && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!pkg.pago && (<Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(pkg.id)} className="hover:bg-green-100 hover:text-green-800"><DollarSign className="w-4 h-4" /></Button>)}
                      <Button variant="ghost" size="icon" onClick={() => onEdit?.(pkg)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete?.(pkg)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );})}
        </TableBody>
      </Table>
    </div>

    {/* --- VERSÃO MOBILE (CARDS NEUTROS) --- */}
    <div className="block md:hidden space-y-4">
        {packages.map((pkg) => {
            const displayColor = pkg.corTag || pkg.cor || 'transparent';
            return (
            <Card key={pkg.id} className="relative shadow-sm border border-gray-200">
                <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-lg z-10" style={{ backgroundColor: displayColor }} />
                <CardHeader className="pl-5 py-3 pb-2">
                    <div className="flex justify-between items-start">
                        <div><CardTitle className="text-base font-bold flex items-center gap-2"><Package className="w-4 h-4 text-gray-500" /> {pkg.descricao}</CardTitle></div>
                        <div className="flex flex-col items-end gap-1">
                             {pkg.pago ? (<span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pago</span>) : (<span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pendente</span>)}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pl-5 py-2 text-sm space-y-3 border-t border-dashed border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                             <span className="text-xs font-bold text-gray-500 block mb-0.5">De (Remetente):</span>
                             <div className="flex items-center justify-between"><span className="text-gray-900">{pkg.remetente.nome}</span>{pkg.remetente.telefone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {pkg.remetente.telefone}</span>}</div>
                        </div>
                        <div>
                             <span className="text-xs font-bold text-gray-500 block mb-0.5">Para (Destinatário):</span>
                             <div className="flex items-center justify-between"><span className="text-gray-900">{pkg.destinatario.nome}</span>{pkg.destinatario.telefone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {pkg.destinatario.telefone}</span>}</div>
                        </div>
                    </div>

                    <div className="space-y-1 pt-1">
                         <div className="grid grid-cols-[20px_1fr] gap-1 items-start"><span className="font-bold text-xs text-gray-700">C:</span><span className="text-xs text-gray-600 leading-tight">{formatAddress(pkg.enderecoColeta)}</span></div>
                         <div className="grid grid-cols-[20px_1fr] gap-1 items-start"><span className="font-bold text-xs text-gray-700">E:</span><span className="text-xs text-gray-600 leading-tight">{formatAddress(pkg.enderecoEntrega)}</span></div>
                    </div>

                    <div className="flex gap-3 text-xs text-gray-600 pt-1 border-t border-gray-100 mt-1">
                         <span title="Taxista Coleta"><b>TC:</b> {pkg.taxistaColeta?.pessoa.nome || '-'}</span>
                         <span title="Taxista Entrega"><b>TE:</b> {pkg.taxistaEntrega?.pessoa.nome || '-'}</span>
                         <span title="Comisseiro"><b>C:</b> {pkg.comisseiro?.pessoa.nome || '-'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-100">
                        <div><span className="text-xs text-muted-foreground block">Valor</span><span className="font-bold text-gray-900">{formatCurrency(pkg.valor)}</span></div>
                    </div>
                </CardContent>
                <CardFooter className="pl-5 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                     <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Palette className="w-4 h-4 text-gray-500" /></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-2 grid grid-cols-5 gap-2">
                            {TAG_COLORS.map(c => (<button key={c.hex} className="w-6 h-6 rounded-full border" style={{ backgroundColor: c.hex }} onClick={() => handleColorChange(pkg.id, c.hex)} title={c.label} />))}
                            <button className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px]" onClick={() => handleColorChange(pkg.id, null)}>X</button>
                        </PopoverContent>
                     </Popover>
                     <div className="flex gap-1">
                        {!pkg.pago && (<Button size="sm" variant="ghost" onClick={() => onMarkAsPaid?.(pkg.id)} className="h-8 px-2 text-gray-700 hover:text-gray-800 hover:bg-gray-100"><DollarSign className="w-4 h-4 mr-1" /> Pagar</Button>)}
                        <Button size="sm" variant="ghost" onClick={() => onEdit?.(pkg)} className="h-8 w-8 p-0 text-gray-600"><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete?.(pkg)} className="h-8 w-8 p-0 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                </CardFooter>
            </Card>
        );})}
    </div>
    </>
  );
}