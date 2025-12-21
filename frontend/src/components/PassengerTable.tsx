import React, { useMemo } from 'react';
import { Button } from './ui/button';
import { Edit, Trash2, Briefcase, DollarSign, Palette, Link as LinkIcon, Unlink, GripVertical, Users, MapPin, Car, User, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils'; 
import { TAG_COLORS } from '../constants';

import { DndContext, closestCenter, useSensor, useSensors, DragEndEvent, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortablePassengerGroup, useSortableGroup } from './SortablePassengerGroup';

// --- COMPONENTES AUXILIARES ---

function DragHandle() {
    const context = useSortableGroup();
    if (!context) return <div className="w-4 h-4" />;
    const { attributes, listeners, isDragging } = context;
    return (
        <div className={cn("flex items-center justify-center h-full w-full py-2 touch-none outline-none cursor-grab active:cursor-grabbing", isDragging ? "text-orange-500" : "text-slate-300 hover:text-slate-500")} {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4" />
        </div>
    );
}

// Grid padrão para as colunas
const GRID_COLS = "grid-cols-[40px_40px_minmax(250px,2.5fr)_minmax(200px,1.5fr)_minmax(180px,1.5fr)_80px_100px_110px]";

export interface PassengerData {
    id: number;
    ordem?: number;
    grupoId?: string;
    pessoa: { id: number; nome: string; cpf?: string; telefone?: string; telefones?: string[] };
    enderecoColeta?: { id: number; logradouro?: string; numero?: string; bairro?: string; cidade?: string };
    enderecoEntrega?: { id: number; logradouro?: string; numero?: string; bairro?: string; cidade?: string };
    taxistaColeta?: { id: number; pessoa: { nome: string } };
    taxistaEntrega?: { id: number; pessoa: { nome: string } };
    comisseiro?: { id: number; pessoa: { nome: string } };
    valor?: number;
    pago?: boolean;
    metodoPagamento?: string;
    numeroAssento?: string;
    corTag?: string;
    bagagens?: any[];
    luggageCount?: number;
    onibusId?: number | null;
}

interface PassengerTableProps {
    passengers: PassengerData[];
    onEdit: (p: PassengerData) => void;
    onDelete: (id: number) => void;
    onAddLuggage: (p: PassengerData) => void;
    onBindSeat: (p: PassengerData) => void;
    onTogglePayment: (id: number) => void;
    onUpdateColor: (id: number, color: string) => void;
    onLinkGroup?: (source: PassengerData, targetId: number) => void;
    onUnlinkGroup?: (p: PassengerData) => void;
    onReorder?: (newOrder: PassengerData[]) => void;
}

export default function PassengerTable({
    passengers, onEdit, onDelete, onAddLuggage, onBindSeat, onTogglePayment, onUpdateColor, onUnlinkGroup, onReorder
}: PassengerTableProps) {
    
    // Agrupamento Lógico
    const groupedItems = useMemo(() => {
        const groups: PassengerData[][] = [];
        let currentGroup: PassengerData[] = [];
        
        passengers.forEach((p, index) => {
            if (index === 0) {
                currentGroup.push(p);
            } else {
                const prev = passengers[index - 1];
                // Agrupa se tiver grupoId igual e for sequencial
                if (p.grupoId && prev.grupoId && p.grupoId === prev.grupoId) {
                    currentGroup.push(p);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [p];
                }
            }
        });
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups;
    }, [passengers]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        // Nota: A reordenação aqui é simplificada. O ideal seria reordenar a lista "flat" baseada nos grupos movidos.
        // Como o SortableContext usa IDs dos passageiros, o DnD Kit pode se confundir se arrastarmos grupos inteiros sem um ID único de grupo.
        // Nesta implementação, o ID do item arrastável será o ID do PRIMEIRO passageiro do grupo.
        
        if (over && active.id !== over.id && onReorder) {
            // Encontrar índice do passageiro "Líder" do grupo ativo e alvo
            const oldIndex = passengers.findIndex((p) => p.id === active.id);
            const newIndex = passengers.findIndex((p) => p.id === over.id);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                // Mover lógica (simplificada para demonstração, idealmente move o bloco todo)
                const newOrder = [...passengers];
                const [moved] = newOrder.splice(oldIndex, 1);
                newOrder.splice(newIndex, 0, moved);
                onReorder(newOrder);
            }
        }
    };

    // Renderiza uma linha de passageiro (usada tanto no modo single quanto dentro do grupo)
    const renderPassengerRowContent = (p: PassengerData, isInsideGroup = false) => (
        <>
            <div className="flex flex-col justify-center min-w-0 pr-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 truncate text-sm">{p.pessoa.nome}</span>
                    {p.corTag && <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: p.corTag }} />}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="truncate">{p.pessoa.telefone || '-'}</span>
                    {p.luggageCount && p.luggageCount > 0 ? (
                        <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-1.5 rounded border border-orange-100 font-medium text-[10px]">
                            <Briefcase className="w-3 h-3" /> {p.luggageCount}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Se estiver dentro de grupo, Rota e Afiliados ficam vazios ou mostram info específica se diferente */}
            {!isInsideGroup ? (
                <>
                    <div className="flex flex-col justify-center text-xs space-y-1 pr-2">
                        <div className="text-slate-600 truncate" title={p.enderecoColeta?.logradouro}><strong className="text-slate-400 mr-1">C:</strong>{p.enderecoColeta?.bairro || '-'}</div>
                        <div className="text-slate-600 truncate" title={p.enderecoEntrega?.logradouro}><strong className="text-slate-400 mr-1">E:</strong>{p.enderecoEntrega?.bairro || '-'}</div>
                    </div>
                    <div className="flex flex-col justify-center text-[10px] space-y-1 text-slate-500">
                        {p.taxistaColeta && <div className="truncate">TC: {p.taxistaColeta.pessoa.nome.split(' ')[0]}</div>}
                        {p.taxistaEntrega && <div className="truncate">TE: {p.taxistaEntrega.pessoa.nome.split(' ')[0]}</div>}
                        {p.comisseiro && <div className="truncate">C: {p.comisseiro.pessoa.nome.split(' ')[0]}</div>}
                    </div>
                </>
            ) : (
                // Espaços vazios dentro do card de grupo para manter grid (opcional) ou span
                <div className="col-span-2 flex items-center text-xs text-slate-400 italic pl-4 border-l border-slate-100">
                    {/* Pode adicionar info extra aqui se quiser, ou deixar vazio para focar no nome */}
                    Membro do grupo
                </div>
            )}

            <div className="flex items-center justify-center">
                <button onClick={() => onBindSeat(p)} className={cn("w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-all border", p.numeroAssento ? "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-200" : "bg-white text-slate-300 border-slate-200 hover:border-indigo-300 hover:text-indigo-400")}>
                    {p.numeroAssento || '-'}
                </button>
            </div>

            <div className="flex items-center justify-end pr-4 cursor-pointer" onClick={() => onTogglePayment(p.id)}>
                <div className={cn("text-xs font-medium px-2 py-1 rounded border", p.pago ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>
                    {p.valor ? p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                </div>
            </div>

            <div className="flex items-center justify-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => onEdit(p)}><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => onAddLuggage(p)}><Briefcase className="w-3.5 h-3.5" /></Button>
                <Popover>
                    <PopoverTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-slate-700"><Palette className="w-3.5 h-3.5" /></Button></PopoverTrigger>
                    <PopoverContent className="w-40 p-2"><div className="grid grid-cols-4 gap-1">{TAG_COLORS.map(c => (<div key={c.hex} onClick={() => onUpdateColor(p.id, c.hex)} className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/5" style={{ backgroundColor: c.hex }} />))}</div></PopoverContent>
                </Popover>
                {/* Desvincular apenas se for grupo */}
                {p.grupoId && onUnlinkGroup && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-300 hover:text-blue-600" title="Sair do Grupo" onClick={() => onUnlinkGroup(p)}><Unlink className="w-3.5 h-3.5" /></Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-300 hover:text-red-600" onClick={() => onDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
        </>
    );

    return (
        <div className="space-y-4">
            {/* --- DESKTOP VIEW --- */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* HEADER DA TABELA (GRID) */}
                <div className={`grid ${GRID_COLS} bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 items-center`}>
                    <div className="text-center">Move</div>
                    <div className="text-center">#</div>
                    <div className="pl-1">Passageiro</div>
                    <div className="pl-1">Rota</div>
                    <div className="pl-1">Afiliados</div>
                    <div className="text-center">Assento</div>
                    <div className="text-right pr-4">Valor</div>
                    <div className="text-center">Ações</div>
                </div>

                {/* BODY DA TABELA */}
                <div className="divide-y divide-slate-100">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={groupedItems.map(g => g[0].id)} strategy={verticalListSortingStrategy}>
                            {groupedItems.map((group, groupIndex) => {
                                const isGroup = group.length > 1;
                                const firstPax = group[0]; // Dados comuns baseados no primeiro
                                const leadId = firstPax.id;

                                return (
                                    <SortablePassengerGroup key={leadId} id={leadId}>
                                        <div className="relative group/row">
                                            {/* SE FOR GRUPO > 1, RENDERIZA O CARD UNIFICADO */}
                                            {isGroup ? (
                                                <div className="m-3 border border-indigo-100 rounded-lg shadow-sm overflow-hidden bg-white relative">
                                                    {/* Lateral Colorida */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 z-10"></div>
                                                    
                                                    {/* Cabeçalho do Card (Dados Comuns) */}
                                                    <div className="bg-indigo-50/50 border-b border-indigo-100 px-4 py-3 pl-6 flex items-center gap-6 text-xs">
                                                        <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase tracking-wide">
                                                            <Users className="w-4 h-4" /> Grupo Familiar
                                                        </div>
                                                        
                                                        {/* Rota Resumida */}
                                                        <div className="flex items-center gap-4 text-slate-600 flex-1">
                                                            <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={firstPax.enderecoColeta?.logradouro}>
                                                                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> 
                                                                <span className="font-semibold text-slate-500">De:</span> {firstPax.enderecoColeta?.bairro || firstPax.enderecoColeta?.cidade || '-'}
                                                            </div>
                                                            <ChevronRight className="w-3 h-3 text-slate-300" />
                                                            <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={firstPax.enderecoEntrega?.logradouro}>
                                                                <MapPin className="w-3.5 h-3.5 text-orange-400" /> 
                                                                <span className="font-semibold text-slate-500">Para:</span> {firstPax.enderecoEntrega?.bairro || firstPax.enderecoEntrega?.cidade || '-'}
                                                            </div>
                                                        </div>

                                                        {/* Afiliados Resumidos */}
                                                        <div className="flex gap-4 text-slate-500">
                                                            {firstPax.taxistaColeta && <div className="flex gap-1 items-center"><Car className="w-3 h-3" /> <span className="font-medium text-slate-700">{firstPax.taxistaColeta.pessoa.nome.split(' ')[0]}</span></div>}
                                                            {firstPax.comisseiro && <div className="flex gap-1 items-center"><User className="w-3 h-3" /> <span className="font-medium text-slate-700">{firstPax.comisseiro.pessoa.nome.split(' ')[0]}</span></div>}
                                                        </div>
                                                        
                                                        {/* Handle de arrastar o grupo todo */}
                                                        <div className="ml-auto"><DragHandle /></div>
                                                    </div>

                                                    {/* Lista de Membros do Grupo */}
                                                    <div className="divide-y divide-slate-50 pl-2">
                                                        {group.map((p, idx) => (
                                                            <div key={p.id} className={`grid ${GRID_COLS} items-center py-2 hover:bg-slate-50 transition-colors`}>
                                                                {/* Colunas vazias para Handle e Index dentro do card, ou customizadas */}
                                                                <div className="flex justify-center text-[10px] text-slate-300 font-mono">{idx + 1}</div>
                                                                <div className="text-center text-slate-400 text-xs">#</div> {/* Placeholder do ID global se quiser */}
                                                                
                                                                {renderPassengerRowContent(p, true)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                // SE FOR PASSAGEIRO ÚNICO (LINHA PADRÃO)
                                                <div className={`grid ${GRID_COLS} items-center py-3 hover:bg-slate-50 transition-colors`}>
                                                    <div className="h-full"><DragHandle /></div>
                                                    <div className="text-center font-medium text-slate-400 text-xs">{groupIndex + 1}</div>
                                                    {renderPassengerRowContent(firstPax, false)}
                                                </div>
                                            )}
                                        </div>
                                    </SortablePassengerGroup>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>

            {/* --- MOBILE VIEW (MANTIDO E MELHORADO) --- */}
            <div className="block md:hidden space-y-4">
                {groupedItems.map((group, groupIndex) => {
                    const isGrouped = group.length > 1;
                    const common = group[0];
                    return (
                        <div key={groupIndex} className={cn("rounded-xl border overflow-hidden bg-white shadow-sm", isGrouped ? "border-indigo-200 ring-1 ring-indigo-50" : "border-slate-200")}>
                            {/* Header Unificado Mobile */}
                            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-col gap-2">
                                {isGrouped && (
                                    <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase text-[10px] tracking-wider mb-1">
                                        <Users className="w-3.5 h-3.5" /> Família / Grupo
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-1 text-xs text-slate-600">
                                    <div className="flex items-center gap-2"><strong className="text-slate-400 w-4">C:</strong> <span className="truncate">{common.enderecoColeta?.bairro || common.enderecoColeta?.cidade || '-'}</span></div>
                                    <div className="flex items-center gap-2"><strong className="text-slate-400 w-4">E:</strong> <span className="truncate">{common.enderecoEntrega?.bairro || common.enderecoEntrega?.cidade || '-'}</span></div>
                                </div>
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {group.map(p => (
                                    <div key={p.id} className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-slate-900">{p.pessoa.nome}</div>
                                                <div className="text-xs text-slate-500">{p.pessoa.telefone}</div>
                                            </div>
                                            <div className={cn("text-[10px] font-bold px-2 py-1 rounded uppercase", p.pago ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                                                {p.pago ? 'Pago' : 'Pendente'}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <Button size="sm" variant="outline" className="h-8 text-xs border-slate-200" onClick={() => onBindSeat(p)}>
                                                Poltrona {p.numeroAssento || '-'}
                                            </Button>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(p)}><Edit className="w-4 h-4 text-slate-400" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(p.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}