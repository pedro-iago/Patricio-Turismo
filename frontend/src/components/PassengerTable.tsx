import React, { useMemo } from 'react';
import { Table, TableHead, TableHeader, TableRow, TableCell } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, Briefcase, DollarSign, Palette, Phone, User, Link as LinkIcon, Unlink, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import api from '../services/api';
import { cn, normalizeString } from './ui/utils'; 
import { TAG_COLORS } from '../constants';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePassengerGroup, useSortableGroup } from './SortablePassengerGroup';

// --- Componente do Handle ---
function DragHandle() {
    const context = useSortableGroup();
    if (!context) return <div className="w-4 h-4" />;
    const { attributes, listeners, isDragging } = context;
    return (
        <div className={cn("flex items-center justify-center h-full w-full py-4 touch-none outline-none", isDragging ? "cursor-grabbing" : "cursor-grab")} {...attributes} {...listeners}>
            <GripVertical className={cn("w-4 h-4 transition-colors", isDragging ? "text-orange-400" : "text-gray-300 hover:text-gray-500")} />
        </div>
    );
}

// --- Interfaces ---
interface Person { id: number; nome: string; cpf: string; telefones?: string[]; telefone?: string | null; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Trip { id: number; }
interface Bus { id: number; placa: string; modelo: string; }
interface Bagagem { id: number; descricao: string; }

export interface PassengerData {
  id: number;
  pessoa: Person;
  viagem: Trip;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
  luggageCount: number;
  bagagens?: Bagagem[];
  volumes?: Bagagem[];
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
  numeroAssento?: string;
  onibusId?: number;
  corTag?: string;
  ordem?: number;
  grupoId?: string;
}

const formatAddress = (addr?: Address) => {
  if (!addr) return <span className="text-gray-400 italic">Não informado</span>;
  return `${addr.logradouro || ''}, ${addr.numero || ''} - ${addr.bairro || ''}, ${addr.cidade || ''}`;
};
const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
const formatPhones = (p: Person) => {
    if (p.telefones && p.telefones.length > 0) return p.telefones.join(' / ');
    if (p.telefone) return p.telefone;
    return '-';
};
const getBusSigla = (bus?: Bus) => {
    if (!bus) return null;
    return bus.placa.slice(-4).toUpperCase();
};

interface PassengerTableProps {
  passengers: PassengerData[];
  loading: boolean;
  isPrintView?: boolean;
  busMap?: Map<number, Bus>;
  organizeMode?: 'padrao' | 'cidade' | 'taxista' | 'comisseiro';
  cityGroupBy?: 'coleta' | 'entrega'; // NOVA PROP
  onMarkAsPaid?: (id: number) => void;
  onOpenLuggage?: (passenger: PassengerData) => void;
  onEdit?: (passenger: PassengerData) => void;
  onDelete?: (passenger: PassengerData) => void;
  onRefreshData: () => void;
  onReorder?: (newOrder: PassengerData[]) => void;
  onLink?: (current: PassengerData, previous: PassengerData) => void;
  onUnlink?: (passenger: PassengerData) => void;
}

export default function PassengerTable({
  passengers,
  loading,
  isPrintView = false,
  busMap,
  organizeMode = 'padrao',
  cityGroupBy = 'coleta', // Default
  onMarkAsPaid,
  onOpenLuggage,
  onEdit,
  onDelete,
  onRefreshData,
  onReorder,
  onLink,
  onUnlink
}: PassengerTableProps) {
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    passengers.forEach(p => { if (p.grupoId) counts.set(p.grupoId, (counts.get(p.grupoId) || 0) + 1); });
    return counts;
  }, [passengers]);

  const groupedPassengers = useMemo(() => {
    const groups: PassengerData[][] = [];
    let currentGroup: PassengerData[] = [];

    passengers.forEach((p, index) => {
        const prev = passengers[index - 1];
        if (!prev) { currentGroup.push(p); return; }

        let shouldBreakGroup = false;

        if (organizeMode === 'cidade') {
            // Usa a prop cityGroupBy para decidir qual endereço comparar
            const addrPrev = cityGroupBy === 'coleta' ? prev.enderecoColeta : prev.enderecoEntrega;
            const addrCurr = cityGroupBy === 'coleta' ? p.enderecoColeta : p.enderecoEntrega;
            const cityA = normalizeString(addrPrev?.cidade);
            const cityB = normalizeString(addrCurr?.cidade);
            shouldBreakGroup = cityA !== cityB;
        } 
        else if (organizeMode === 'taxista') {
            const taxA = prev.taxistaColeta?.id || 0;
            const taxB = p.taxistaColeta?.id || 0;
            shouldBreakGroup = taxA !== taxB;
        }
        else if (organizeMode === 'comisseiro') {
            const comA = prev.comisseiro?.id || 0;
            const comB = p.comisseiro?.id || 0;
            shouldBreakGroup = comA !== comB;
        }
        else {
            const sameGroup = p.grupoId && prev.grupoId && prev.grupoId === p.grupoId;
            shouldBreakGroup = !sameGroup;
        }

        if (shouldBreakGroup) { groups.push([...currentGroup]); currentGroup = [p]; } 
        else { currentGroup.push(p); }
    });
    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }, [passengers, organizeMode, cityGroupBy]);

  const sortableIds = useMemo(() => groupedPassengers.map(g => g[0].id), [groupedPassengers]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
        const oldGroupIndex = groupedPassengers.findIndex(g => g[0].id === active.id);
        const newGroupIndex = groupedPassengers.findIndex(g => g[0].id === over.id);
        if (oldGroupIndex !== -1 && newGroupIndex !== -1) {
            const newGroups = arrayMove(groupedPassengers, oldGroupIndex, newGroupIndex);
            onReorder(newGroups.flat());
        }
    }
  };

  const handleColorChange = async (passengerId: number, color: string | null) => {
    try {
        const targetPassenger = passengers.find(p => p.id === passengerId);
        if (targetPassenger && targetPassenger.grupoId) {
            const groupMembers = passengers.filter(p => p.grupoId === targetPassenger.grupoId);
            await Promise.all(groupMembers.map(member => api.patch(`/api/passageiroviagem/${member.id}/cor`, { cor: color })));
        } else {
            await api.patch(`/api/passageiroviagem/${passengerId}/cor`, { cor: color });
        }
        onRefreshData(); 
    } catch (error) { console.error("Erro ao salvar cor:", error); }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando passageiros...</div>;
  if (!passengers || passengers.length === 0) return <div className="text-center py-8 text-muted-foreground">Nenhum passageiro encontrado</div>;

  return (
    <>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-print-clean hidden md:block overflow-hidden">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              {!isPrintView && <TableHead className="w-8 pt-no-print"></TableHead>} 
              {!isPrintView && <TableHead className="w-8 pt-no-print"></TableHead>} 
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="pt-print-col-passageiro w-[25%]">Passageiro</TableHead>
              <TableHead className="pt-print-col-endereco w-[25%]">Coleta / Entrega</TableHead>
              <TableHead className="pt-print-col-afiliado">Taxista / Comisseiro</TableHead>
              <TableHead className="pt-print-col-valor w-20">Valor</TableHead>
              <TableHead className="pt-print-col-status w-24">Status</TableHead>
              <TableHead className="pt-print-col-assento text-center w-20">Assento</TableHead>
              <TableHead className="pt-print-col-bagagem text-center w-16">Bagagem</TableHead>
              {!isPrintView && <TableHead className="text-right pt-no-print w-32">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {groupedPassengers.map((group, groupIndex) => {
                const isGrouped = group.length > 1 || organizeMode !== 'padrao';
                const firstPassengerId = group[0].id;

                let sectionHeader = null;
                if (organizeMode !== 'padrao' && !isPrintView) {
                    let title = "";
                    let icon = "";
                    const p1 = group[0];

                    if (organizeMode === 'cidade') {
                        // Título do cabeçalho baseado na escolha Coleta ou Entrega
                        const addr = cityGroupBy === 'coleta' ? p1.enderecoColeta : p1.enderecoEntrega;
                        title = addr?.cidade || "Cidade Não Informada";
                        icon = "📍";
                    } else if (organizeMode === 'taxista') {
                        title = p1.taxistaColeta?.pessoa.nome || "Sem Taxista";
                        icon = "🚖";
                    } else if (organizeMode === 'comisseiro') {
                        title = p1.comisseiro?.pessoa.nome || "Sem Comisseiro";
                        icon = "👔";
                    }

                    sectionHeader = (
                        <TableRow className="bg-slate-100/80 hover:bg-slate-200 cursor-default border-b border-slate-200">
                            <TableCell colSpan={100} className="py-2 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                {icon} {title} <span className="ml-2 font-normal text-slate-400">({group.length})</span>
                            </TableCell>
                        </TableRow>
                    );
                }

                return (
                    <React.Fragment key={firstPassengerId}>
                        {sectionHeader}
                        <SortablePassengerGroup id={firstPassengerId} isGrouped={isGrouped}>
                            {group.map((passenger, indexInGroup) => {
                                const globalIndex = passengers.findIndex(p => p.id === passenger.id);
                                const bus = passenger.onibusId && busMap ? busMap.get(passenger.onibusId) : undefined;
                                const busSigla = getBusSigla(bus);
                                const isFirstInGroup = indexInGroup === 0;
                                const isLastInGroup = indexInGroup === group.length - 1;
                                const isLinkedToPrevious = !isFirstInGroup; 
                                const prevGroup = groupedPassengers[groupIndex - 1];
                                const canLinkToAbove = isFirstInGroup && prevGroup && organizeMode === 'padrao'; 
                                const previousPassenger = prevGroup ? prevGroup[prevGroup.length - 1] : null;

                                const borderTopClass = isGrouped && isFirstInGroup ? "border-t-2 border-orange-200" : "border-t-0";
                                const borderBottomClass = isGrouped ? (isLastInGroup ? "border-b-2 border-orange-200" : "border-b-0 border-transparent") : "border-b";
                                const rowBg = isGrouped ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-slate-50";
                                const cellBorderClass = isGrouped ? cn(isFirstInGroup && "border-t-2 border-orange-200", isLastInGroup && "border-b-2 border-orange-200") : "";

                                // GARANTIA TOTAL DA LISTA DE BAGAGENS
                                const listaBagagens = passenger.bagagens || passenger.volumes || [];

                                return (
                                    <TableRow key={passenger.id} className={cn("transition-colors group", rowBg, borderTopClass, borderBottomClass)}>
                                        {/* ... Células de Drag/Link mantidas iguais ... */}
                                        {!isPrintView && (
                                            <TableCell className={cn("w-8 p-0 relative border-l-2 align-middle", isGrouped ? "border-orange-200" : "border-transparent", cellBorderClass)}>
                                                <div className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r-md z-20" style={{ backgroundColor: passenger.corTag || 'transparent', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
                                                {isFirstInGroup ? <DragHandle /> : <div className="flex items-center justify-center h-full w-full min-h-[40px]"><div className="w-px h-full bg-orange-100 absolute top-0 bottom-0"></div></div>}
                                            </TableCell>
                                        )}
                                        {!isPrintView && (
                                            <TableCell className={cn("p-0 text-center relative w-8 align-middle", cellBorderClass)}>
                                                {/* ... Logica de Link ... */}
                                                {isLinkedToPrevious && organizeMode === 'padrao' && (
                                                    <>
                                                        <div className="absolute left-1/2 top-0 bottom-1/2 w-0.5 -ml-px bg-orange-200 z-0 pointer-events-none" />
                                                        <div className="absolute left-1/2 top-1/2 w-2 h-0.5 -ml-px bg-orange-200 z-0 pointer-events-none" />
                                                    </>
                                                )}
                                                <div className="relative z-10 flex items-center justify-center h-full py-3">
                                                    {isLinkedToPrevious && organizeMode === 'padrao' ? (
                                                        <Button variant="ghost" size="icon" className="group/btn w-6 h-6 rounded-full bg-orange-50 border border-orange-200 text-orange-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 p-0 transition-all" onClick={() => onUnlink?.(passenger)}>
                                                            <LinkIcon className="w-3 h-3 block group-hover/btn:hidden" />
                                                            <Unlink className="w-3 h-3 hidden group-hover/btn:block" />
                                                        </Button>
                                                    ) : canLinkToAbove ? (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-orange-400 hover:bg-orange-50 p-0" onClick={() => previousPassenger && onLink?.(passenger, previousPassenger)}>
                                                            <LinkIcon className="w-3 h-3" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        )}

                                        <TableCell className={cn("p-2 text-center relative align-middle", cellBorderClass)}>
                                            {isPrintView && <div className="absolute left-0 top-1 bottom-1 w-1.5 rounded-r-md z-20" style={{ boxShadow: `inset 0 0 0 10px ${passenger.corTag || 'transparent'}`, borderLeft: `6px solid ${passenger.corTag || 'transparent'}`, backgroundColor: passenger.corTag || 'transparent', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />}
                                            <span className="relative z-10 font-bold text-xs text-gray-600">{globalIndex + 1}</span>
                                            {!isPrintView && (
                                                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/90 backdrop-blur-sm">
                                                    <Popover>
                                                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Palette className="w-3 h-3 text-gray-500" /></Button></PopoverTrigger>
                                                        <PopoverContent className="w-56 p-2 flex flex-wrap gap-2 z-50 justify-center">
                                                            {TAG_COLORS.map(c => (<button key={c.hex} className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110" style={{ backgroundColor: c.hex }} onClick={() => handleColorChange(passenger.id, c.hex)} />))}
                                                            <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 hover:bg-gray-100" onClick={() => handleColorChange(passenger.id, null)}>X</button>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className={cn("pt-print-col-passageiro align-middle", cellBorderClass)}>
                                            <div className="font-medium">{passenger.pessoa.nome}</div>
                                            <div className="text-xs text-muted-foreground">{passenger.pessoa.cpf}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5" title="Telefones">{formatPhones(passenger.pessoa)}</div>
                                            
                                            {/* === BAGAGEM: CORRIGIDO PARA EXIBIR SEMPRE DESCRIÇÃO === */}
                                            {listaBagagens.length > 0 && (
                                                <div className={cn("mt-1.5 flex items-start gap-1 p-0 rounded-md text-[10px] leading-tight", isPrintView ? "block break-words" : "")}>
                                                    {!isPrintView && <Briefcase className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />}
                                                    <span>
                                                        <span className="font-bold text-slate-800 mr-1">
                                                            {isPrintView ? `[${listaBagagens.length} Vol]:` : `${listaBagagens.length} Vol:`}
                                                        </span>
                                                        {/* Garante cor escura na impressão */}
                                                        <span className={isPrintView ? "text-black font-semibold" : "text-slate-600"}>
                                                            {listaBagagens.map(b => b.descricao).join(', ')}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className={cn("pt-print-col-endereco align-middle", cellBorderClass)}><div className="text-xs"><b>C:</b> {formatAddress(passenger.enderecoColeta)}</div><div className="text-xs"><b>E:</b> {formatAddress(passenger.enderecoEntrega)}</div></TableCell>
                                        <TableCell className={cn("pt-print-col-afiliado align-middle", cellBorderClass)}><div className="text-xs"><b>TC:</b> {passenger.taxistaColeta?.pessoa.nome || '-'}</div><div className="text-xs"><b>TE:</b> {passenger.taxistaEntrega?.pessoa.nome || '-'}</div><div className="text-xs"><b>C:</b> {passenger.comisseiro?.pessoa.nome || '-'}</div></TableCell>
                                        <TableCell className={cn("pt-print-col-valor align-middle", cellBorderClass)}>{formatCurrency(passenger.valor)}</TableCell>
                                        <TableCell className={cn("pt-print-col-status align-middle", cellBorderClass)}>
                                            {passenger.pago ? (<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 print:border-0">Pago</span>) : (<span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 print:border-0 print:text-[10px] print:px-1 print:py-0">{isPrintView ? "Pend." : "Pendente"}</span>)}
                                        </TableCell>
                                        <TableCell className={cn("pt-print-col-assento text-center align-middle", cellBorderClass)}><div className="flex flex-col items-center justify-center"><span className="text-sm font-bold">{passenger.numeroAssento || '-'}</span>{busSigla && (<span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1 rounded border border-gray-200 mt-0.5" title={`Ônibus: ${bus?.placa}`}>{busSigla}</span>)}</div></TableCell>
                                        <TableCell className={cn("pt-print-col-bagagem text-center align-middle", cellBorderClass)}>{passenger.luggageCount}</TableCell>
                                        {!isPrintView && (
                                            <TableCell className={cn("text-right pt-no-print align-middle", isGrouped ? "border-r-2 border-orange-200" : "", cellBorderClass)}>
                                                <div className="flex items-center justify-end gap-1">
                                                    {!passenger.pago && (<Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(passenger.id)} className="hover:bg-green-100 hover:text-green-800"><DollarSign className="w-4 h-4" /></Button>)}
                                                    <Button variant="ghost" size="icon" onClick={() => onOpenLuggage?.(passenger)} className="hover:bg-primary/10 hover:text-primary"><Briefcase className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(passenger)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(passenger)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </SortablePassengerGroup>
                    </React.Fragment>
                );
            })}
          </SortableContext>
        </Table>
      </DndContext>
    </div>
    <div className="block md:hidden space-y-4">
        {groupedPassengers.map((group) => {
            const isGrouped = group.length > 1;
            const cardContainerClass = isGrouped ? "bg-orange-50/30 border-orange-300 shadow-md" : "bg-white border-gray-200 shadow-sm";
            return (
                <Card key={group[0].id} className={cn("relative border overflow-hidden", cardContainerClass)}>
                     {isGrouped && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-300 z-10" />}
                     {group.map((passenger, index) => (
                        <div key={passenger.id} className="relative border-b last:border-0 border-orange-200/50">
                             <CardHeader className="pl-5 py-3 pb-2"><CardTitle className="text-sm">{passenger.pessoa.nome}</CardTitle></CardHeader>
                        </div>
                     ))}
                </Card>
            );
        })}
    </div>
    </>
  );
}