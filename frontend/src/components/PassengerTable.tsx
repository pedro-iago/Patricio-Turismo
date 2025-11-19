import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, Briefcase, DollarSign, Palette, Phone, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import api from '../services/api';

// --- Interfaces ---
interface Person { id: number; nome: string; cpf: string; telefone?: string | null; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Trip { id: number; }
interface Bus { id: number; placa: string; modelo: string; }

interface PassengerData {
  id: number;
  pessoa: Person;
  viagem: Trip;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
  luggageCount: number;
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
  numeroAssento?: string;
  onibusId?: number;
  corTag?: string;
}

const formatAddress = (addr?: Address) => {
  if (!addr) return <span className="text-gray-400 italic">Não informado</span>;
  return `${addr.logradouro || ''}, ${addr.numero || ''} - ${addr.bairro || ''}, ${addr.cidade || ''}`;
};
const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getBusSigla = (bus?: Bus) => {
    if (!bus) return null;
    return bus.placa.slice(-4).toUpperCase();
};

const TAG_COLORS = [
  { hex: '#ef4444', label: 'Vermelho' },
  { hex: '#f97316', label: 'Laranja' },
  { hex: '#eab308', label: 'Amarelo' },
  { hex: '#22c55e', label: 'Verde' },
  { hex: '#3b82f6', label: 'Azul' },
  { hex: '#a855f7', label: 'Roxo' },
  { hex: '#64748b', label: 'Cinza' },
];

interface PassengerTableProps {
  passengers: PassengerData[];
  loading: boolean;
  isPrintView?: boolean;
  busMap?: Map<number, Bus>;
  onMarkAsPaid?: (id: number) => void;
  onOpenLuggage?: (passenger: PassengerData) => void;
  onEdit?: (passenger: PassengerData) => void;
  onDelete?: (passenger: PassengerData) => void;
  onRefreshData: () => void;
}

export default function PassengerTable({
  passengers,
  loading,
  isPrintView = false,
  busMap,
  onMarkAsPaid,
  onOpenLuggage,
  onEdit,
  onDelete,
  onRefreshData,
}: PassengerTableProps) {
  
  const handleColorChange = async (passengerId: number, color: string | null) => {
    try {
        await api.patch(`/api/passageiroviagem/${passengerId}/cor`, { cor: color });
        onRefreshData(); 
    } catch (error) {
        console.error("Erro ao salvar cor:", error);
        alert("Falha ao salvar a cor.");
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando passageiros...</div>;
  if (!passengers || passengers.length === 0) return <div className="text-center py-8 text-muted-foreground">Nenhum passageiro encontrado</div>;

  return (
    <>
    {/* --- VERSÃO DESKTOP --- */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-print-clean hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="pt-print-col-passageiro">Passageiro</TableHead>
            <TableHead className="pt-print-col-endereco">Coleta / Entrega</TableHead>
            <TableHead className="pt-print-col-afiliado">Taxista / Comisseiro</TableHead>
            <TableHead className="pt-print-col-valor">Valor</TableHead>
            <TableHead className="pt-print-col-status">Status</TableHead>
            <TableHead className="pt-print-col-assento text-center">Assento / Ônibus</TableHead>
            <TableHead className="pt-print-col-bagagem text-center">Bagagem</TableHead>
            {!isPrintView && <TableHead className="text-right pt-no-print">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
            {passengers.map((passenger, index) => {
              const bus = passenger.onibusId && busMap ? busMap.get(passenger.onibusId) : undefined;
              const busSigla = getBusSigla(bus);

              return (
              <TableRow key={passenger.id} className="group hover:bg-slate-50 transition-colors">
                <TableCell className="p-2 text-center relative">
                   <span className="relative z-10 font-bold text-xs text-gray-600">{index + 1}</span>
                   <div className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r-md" style={{ backgroundColor: passenger.corTag || 'transparent', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
                   {!isPrintView && (
                       <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/90 backdrop-blur-sm">
                         <Popover>
                             <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Palette className="w-3 h-3 text-gray-500" /></Button></PopoverTrigger>
                             <PopoverContent className="w-40 p-2 grid grid-cols-4 gap-2 z-50">
                                 {TAG_COLORS.map(c => (<button key={c.hex} className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform" style={{ backgroundColor: c.hex }} onClick={() => handleColorChange(passenger.id, c.hex)} />))}
                                 <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 hover:bg-gray-100" onClick={() => handleColorChange(passenger.id, null)}>X</button>
                             </PopoverContent>
                         </Popover>
                       </div>
                   )}
                </TableCell>

                <TableCell className="pt-print-col-passageiro">
                  <div className="font-medium">{passenger.pessoa.nome}</div>
                  <div className="text-xs text-muted-foreground">{passenger.pessoa.cpf}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{passenger.pessoa.telefone || '-'}</div>
                </TableCell>
                <TableCell className="pt-print-col-endereco">
                  <div className="text-xs"><b>C:</b> {formatAddress(passenger.enderecoColeta)}</div>
                  <div className="text-xs"><b>E:</b> {formatAddress(passenger.enderecoEntrega)}</div>
                </TableCell>
                <TableCell className="pt-print-col-afiliado">
                  <div className="text-xs"><b>TC:</b> {passenger.taxistaColeta?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>TE:</b> {passenger.taxistaEntrega?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>C:</b> {passenger.comisseiro?.pessoa.nome || '-'}</div>
                </TableCell>
                <TableCell className="pt-print-col-valor">{formatCurrency(passenger.valor)}</TableCell>
                <TableCell className="pt-print-col-status">
                  {passenger.pago ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 print:border-0">Pago</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 print:border-0">Pendente</span>
                  )}
                </TableCell>
                <TableCell className="pt-print-col-assento text-center">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-sm font-bold">{passenger.numeroAssento || '-'}</span>
                        {busSigla && (<span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded border border-gray-200 mt-0.5" title={`Ônibus: ${bus?.placa}`}>{busSigla}</span>)}
                    </div>
                </TableCell>
                <TableCell className="pt-print-col-bagagem text-center">{passenger.luggageCount}</TableCell>
                
                {!isPrintView && (
                  <TableCell className="text-right pt-no-print">
                    <div className="flex items-center justify-end gap-1">
                      {!passenger.pago && (<Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(passenger.id)} className="hover:bg-green-100 hover:text-green-800"><DollarSign className="w-4 h-4" /></Button>)}
                      <Button variant="ghost" size="icon" onClick={() => onOpenLuggage?.(passenger)} className="hover:bg-primary/10 hover:text-primary"><Briefcase className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit?.(passenger)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete?.(passenger)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );})}
        </TableBody>
      </Table>
    </div>

    {/* --- VERSÃO MOBILE (CARDS) --- */}
    <div className="block md:hidden space-y-4">
        {passengers.map((passenger, index) => {
            const bus = passenger.onibusId && busMap ? busMap.get(passenger.onibusId) : undefined;
            const busSigla = getBusSigla(bus);
            return (
            <Card key={passenger.id} className="relative shadow-sm border border-gray-200">
                <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-lg z-10" style={{ backgroundColor: passenger.corTag || 'transparent' }} />
                <CardHeader className="pl-5 py-3 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <span className="text-xs text-gray-400 mr-1">#{index + 1}</span> 
                                {passenger.pessoa.nome}
                            </CardTitle>
                            <div className="flex flex-col mt-1">
                                <div className="flex items-center text-xs text-muted-foreground gap-2"><Phone className="w-3 h-3" /> {passenger.pessoa.telefone || 'S/N'}</div>
                                <div className="flex items-center text-xs text-muted-foreground gap-2 mt-0.5"><User className="w-3 h-3" /> {passenger.pessoa.cpf || 'S/DOC'}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                             <div className="flex items-center gap-1">
                                 {busSigla && (<span className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1 rounded border">{busSigla}</span>)}
                                 <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded border">Assento: {passenger.numeroAssento || '-'}</span>
                             </div>
                             {passenger.pago ? (<span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pago</span>) : (<span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pendente</span>)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pl-5 py-2 text-sm space-y-2 border-t border-dashed border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-[20px_1fr] gap-1 items-start"><span className="font-bold text-xs text-gray-700">C:</span><span className="text-xs text-gray-600 leading-tight">{formatAddress(passenger.enderecoColeta)}</span></div>
                    <div className="grid grid-cols-[20px_1fr] gap-1 items-start"><span className="font-bold text-xs text-gray-700">E:</span><span className="text-xs text-gray-600 leading-tight">{formatAddress(passenger.enderecoEntrega)}</span></div>
                    
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 pt-1 border-t border-gray-100 mt-1">
                        <div><span className="font-bold block">Coleta (TC):</span> {passenger.taxistaColeta?.pessoa.nome || '-'}</div>
                        <div><span className="font-bold block">Entrega (TE):</span> {passenger.taxistaEntrega?.pessoa.nome || '-'}</div>
                        <div><span className="font-bold block">Comis (C):</span> {passenger.comisseiro?.pessoa.nome || '-'}</div>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                        <div><span className="text-xs text-muted-foreground block">Valor</span><span className="font-bold text-gray-900">{formatCurrency(passenger.valor)}</span></div>
                        <div><span className="text-xs text-muted-foreground block text-right">Bagagem</span><span className="font-bold text-gray-900 block text-right">{passenger.luggageCount} vol</span></div>
                    </div>
                </CardContent>
                <CardFooter className="pl-5 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                     <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Palette className="w-4 h-4 text-gray-500" /></Button></PopoverTrigger>
                        <PopoverContent className="w-48 p-2 grid grid-cols-4 gap-2">
                            {TAG_COLORS.map(c => (<button key={c.hex} className="w-6 h-6 rounded-full border" style={{ backgroundColor: c.hex }} onClick={() => handleColorChange(passenger.id, c.hex)} />))}
                            <button className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px]" onClick={() => handleColorChange(passenger.id, null)}>X</button>
                        </PopoverContent>
                     </Popover>
                     <div className="flex gap-1">
                        {!passenger.pago && (<Button size="sm" variant="ghost" onClick={() => onMarkAsPaid?.(passenger.id)} className="h-8 px-2 text-gray-700 hover:text-gray-800 hover:bg-gray-100"><DollarSign className="w-4 h-4 mr-1" /> Pagar</Button>)}
                        <Button size="sm" variant="ghost" onClick={() => onOpenLuggage?.(passenger)} className="h-8 w-8 p-0"><Briefcase className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => onEdit?.(passenger)} className="h-8 w-8 p-0 text-gray-600"><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete?.(passenger)} className="h-8 w-8 p-0 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                     </div>
                </CardFooter>
            </Card>
        )})}
    </div>
    </>
  );
}