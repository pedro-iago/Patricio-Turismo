import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { 
  GripVertical, MapPin, DollarSign, Briefcase, Edit, Trash2, 
  Link as LinkIcon, Phone, FileText, Palette, Unlink, User
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// --- PALETA DE CORES (MANTIDA) ---
const TAG_COLORS = [
    { hex: '#ef4444', label: 'Vermelho' }, { hex: '#dc2626', label: 'Vermelho Escuro' },
    { hex: '#f43f5e', label: 'Rose' }, { hex: '#be123c', label: 'Rose Escuro' },
    { hex: '#ec4899', label: 'Rosa' }, { hex: '#be185d', label: 'Rosa Escuro' },
    { hex: '#d946ef', label: 'Fúcsia' }, { hex: '#a21caf', label: 'Fúcsia Escuro' },
    { hex: '#a855f7', label: 'Roxo' }, { hex: '#7e22ce', label: 'Roxo Escuro' },
    { hex: '#8b5cf6', label: 'Violeta' }, { hex: '#6d28d9', label: 'Violeta Escuro' },
    { hex: '#6366f1', label: 'Índigo' }, { hex: '#4338ca', label: 'Índigo Escuro' },
    { hex: '#3b82f6', label: 'Azul' }, { hex: '#1d4ed8', label: 'Azul Escuro' },
    { hex: '#0ea5e9', label: 'Sky' }, { hex: '#0369a1', label: 'Sky Escuro' },
    { hex: '#06b6d4', label: 'Ciano' }, { hex: '#0e7490', label: 'Ciano Escuro' },
    { hex: '#14b8a6', label: 'Teal' }, { hex: '#0f766e', label: 'Teal Escuro' },
    { hex: '#10b981', label: 'Esmeralda' }, { hex: '#047857', label: 'Esmeralda Escuro' },
    { hex: '#22c55e', label: 'Verde' }, { hex: '#15803d', label: 'Verde Escuro' },
    { hex: '#84cc16', label: 'Lima' }, { hex: '#4d7c0f', label: 'Lima Escuro' },
    { hex: '#eab308', label: 'Amarelo' }, { hex: '#a16207', label: 'Amarelo Escuro' },
    { hex: '#f59e0b', label: 'Âmbar' }, { hex: '#b45309', label: 'Âmbar Escuro' },
    { hex: '#f97316', label: 'Laranja' }, { hex: '#c2410c', label: 'Laranja Escuro' },
    { hex: '#64748b', label: 'Slate' }, { hex: '#334155', label: 'Slate Escuro' },
    { hex: '#71717a', label: 'Zinc' }, { hex: '#3f3f46', label: 'Zinc Escuro' },
    { hex: '#737373', label: 'Neutral' }, { hex: '#404040', label: 'Neutral Escuro' },
    { hex: '#fca5a5', label: 'Pastel Vermelho' }, { hex: '#fdba74', label: 'Pastel Laranja' },
    { hex: '#fcd34d', label: 'Pastel Amarelo' }, { hex: '#bef264', label: 'Pastel Lima' },
    { hex: '#86efac', label: 'Pastel Verde' }, { hex: '#67e8f9', label: 'Pastel Ciano' },
    { hex: '#93c5fd', label: 'Pastel Azul' }, { hex: '#c4b5fd', label: 'Pastel Violeta' },
];

export type Passageiro = {
  id: string;
  nome: string;
  displayDoc: string;
  displayTel: string;
  displayLuggage: number;
  linkColor?: string; 
  dadosCompletos: any; 
};

export type PassageiroGroup = { id: string; items: Passageiro[]; };
export type Bairro = { id: string; nome: string; groups: PassageiroGroup[] };
export type Cidade = { id: string; nome: string; bairros: Bairro[] };

interface PassengerOrganizerProps {
  data: Cidade[];
  onChange: (newData: Cidade[]) => void;
  onMarkAsPaid?: (id: number) => void;
  onEdit?: (passenger: any) => void;
  onOpenLuggage?: (passenger: any) => void;
  onDelete?: (passenger: any) => void;
  onColorChange?: (id: number, color: string | null) => void;
  onLink?: (current: any, previous: any) => void;
  onUnlink?: (passenger: any) => void;
}

// --- CARD VISUAL ---
function PassageiroVisualItem({ 
  passageiro, groupPosition = 'single',
  onMarkAsPaid, onEdit, onOpenLuggage, onDelete, onColorChange, onLink, onUnlink, previousInContext
}: { 
  passageiro: Passageiro, groupPosition?: 'single' | 'head' | 'middle' | 'tail',
  onMarkAsPaid?: (id: number) => void, onEdit?: (p: any) => void, onOpenLuggage?: (p: any) => void, onDelete?: (p: any) => void,
  onColorChange?: (id: number, color: string | null) => void, onLink?: (current: any, prev: any) => void, onUnlink?: (p: any) => void,
  previousInContext?: Passageiro | null 
}) {
  const p = passageiro.dadosCompletos;
  const isPaid = p.pago;
  const luggageCount = passageiro.displayLuggage;
  const hasLuggage = luggageCount > 0;
  
  // Recupera a lista de bagagens dos dados completos
  const listaBagagens = p.bagagens || [];
  
  const groupColor = passageiro.linkColor || 'transparent';
  const isVisualGroup = groupPosition !== 'single';
  const isDbLinked = !!(p.grupoId || p.ligacaoId) && isVisualGroup;

  let roundedClass = 'rounded-md';
  let borderClass = 'border-b';
  let marginClass = 'mb-2';

  if (isVisualGroup) {
      if (groupPosition === 'head') { roundedClass = 'rounded-t-md rounded-b-none'; borderClass = 'border-b-0'; marginClass = 'mb-0'; }
      else if (groupPosition === 'middle') { roundedClass = 'rounded-none'; borderClass = 'border-b-0 border-t'; marginClass = 'mb-0'; }
      else if (groupPosition === 'tail') { roundedClass = 'rounded-b-md rounded-t-none'; borderClass = 'border-b border-t'; marginClass = 'mb-2'; }
  }

  const tagStyle = {
    backgroundColor: groupColor,
    width: groupColor !== 'transparent' ? '6px' : '0px',
    borderTopLeftRadius: (groupPosition === 'single' || groupPosition === 'head') ? '6px' : '0',
    borderBottomLeftRadius: (groupPosition === 'single' || groupPosition === 'tail') ? '6px' : '0',
  };

  const blockBackground = isVisualGroup ? { backgroundColor: `${groupColor}08` } : { backgroundColor: '#fff' }; 
  const busBadge = p.onibus?.apelido ? p.onibus.apelido : (p.onibus?.placa ? p.onibus.placa.substring(0, 4).toUpperCase() : '---'); 

  const formatFullAddress = (addr: any) => {
      if (!addr) return '-';
      const parts = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
      const parts2 = [addr.bairro, addr.cidade].filter(Boolean).join(', ');
      if (!parts && !parts2) return '-';
      if (!parts) return parts2;
      return `${parts} - ${parts2}`;
  };

  const canLink = !isDbLinked && previousInContext; 
  const canUnlink = isDbLinked; 

  return (
    <div className={`relative flex items-stretch border-slate-200 border-x ${borderClass} ${roundedClass} ${marginClass} transition-all`} style={blockBackground}>
      <div style={tagStyle} className="flex-shrink-0 transition-all duration-300"></div>
      
      <div className="flex flex-col justify-center items-center w-6 border-r border-slate-100 bg-slate-50/50">
         {canLink && (<button onClick={() => onLink?.(p, previousInContext?.dadosCompletos)} className="text-slate-300 hover:text-orange-500 p-1 transition-colors" title="Vincular ao card acima"><LinkIcon className="w-3 h-3" /></button>)}
         {canUnlink && (<button onClick={() => onUnlink?.(p)} className="text-orange-300 hover:text-red-500 p-1 transition-colors" title="Desvincular"><Unlink className="w-3 h-3" /></button>)}
      </div>

      <div className="flex-1 flex items-center gap-2 py-3 px-3 overflow-hidden">
        <div className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0 self-center cursor-grab active:cursor-grabbing"><GripVertical className="w-5 h-5" /></div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-center min-w-0">
          
          {/* COLUNA 1: NOME, CONTATO E AGORA BAGAGEM */}
          <div className="md:col-span-4 flex flex-col overflow-hidden pr-2">
            <div className="flex items-center gap-2">
              {isDbLinked && <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: groupColor }} />}
              <span className="font-bold text-slate-950 text-base uppercase truncate leading-snug" title={p.pessoa.nome}>{p.pessoa.nome}</span>
            </div>
            
            <div className="flex flex-col gap-0.5 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-700"><FileText className="w-3.5 h-3.5 opacity-60 flex-shrink-0"/><span className="truncate font-semibold">{passageiro.displayDoc}</span></div>
              <div className="flex items-center gap-1.5 text-xs text-slate-700"><Phone className="w-3.5 h-3.5 opacity-60 flex-shrink-0"/><span className="truncate font-semibold">{passageiro.displayTel}</span></div>
              
              {/* === NOVA ÁREA DE BAGAGENS === */}
              {listaBagagens.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1 pt-1 border-t border-slate-100 border-dashed">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5"/>
                    <span className="truncate font-medium italic">
                        {listaBagagens.map((b: any) => b.descricao).join(', ')}
                    </span>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 2: ENDEREÇOS */}
          <div className="md:col-span-4 flex flex-col gap-1.5 text-xs border-l border-slate-200 pl-3 overflow-hidden">
            <div className="flex items-start gap-1"><span className="font-bold text-slate-900 w-3 shrink-0">C:</span><span className="text-slate-800 leading-tight truncate font-medium" title={formatFullAddress(p.enderecoColeta)}>{formatFullAddress(p.enderecoColeta)}</span></div>
            <div className="flex items-start gap-1"><span className="font-bold text-slate-900 w-3 shrink-0">E:</span><span className="text-slate-800 leading-tight truncate font-medium" title={formatFullAddress(p.enderecoEntrega)}>{formatFullAddress(p.enderecoEntrega)}</span></div>
          </div>

          {/* COLUNA 3: AFILIADOS E VALOR */}
          <div className="md:col-span-2 flex flex-col gap-1 text-xs border-l border-slate-200 pl-3 justify-center">
            <div className="flex flex-col gap-0.5">
                <span className="text-slate-600 text-[10px] truncate" title={`TC: ${p.taxistaColeta?.pessoa?.nome}`}>TC: <span className="text-slate-800 font-bold">{p.taxistaColeta?.pessoa?.nome?.split(' ')[0] || '-'}</span></span>
                <span className="text-slate-600 text-[10px] truncate" title={`TE: ${p.taxistaEntrega?.pessoa?.nome}`}>TE: <span className="text-slate-800 font-bold">{p.taxistaEntrega?.pessoa?.nome?.split(' ')[0] || '-'}</span></span>
                <span className="text-slate-600 text-[10px] truncate" title={`C: ${p.comisseiro?.pessoa?.nome}`}>C: <span className="text-slate-800 font-bold">{p.comisseiro?.pessoa?.nome?.split(' ')[0] || '-'}</span></span>
            </div>
            <div className="border-t border-slate-200 mt-1.5 pt-1"><span className="font-black text-slate-900 text-xs">R$ {p.valor?.toFixed(2)}</span></div>
          </div>

          {/* COLUNA 4: AÇÕES E STATUS */}
          <div className="md:col-span-2 flex flex-col items-end gap-2 pl-1">
            <div className="flex items-center gap-2 justify-end w-full">
                <Badge variant="outline" className={`text-[10px] h-5 px-2 font-bold border-0 ${isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{isPaid ? "Pago" : "Pendente"}</Badge>
                <div className="flex flex-col items-center min-w-[32px]"><span className="font-black text-lg leading-none text-slate-900">{p.numeroAssento || '0'}</span><span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded border border-slate-300 uppercase font-bold">{busBadge}</span></div>
            </div>
            
            <div className="flex items-center gap-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="p-1.5 rounded text-slate-400 hover:text-purple-600 hover:bg-purple-50" title="Cor"><Palette className="w-4 h-4" /></button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 grid grid-cols-8 gap-2 shadow-xl bg-white border-slate-200" align="end">
                        {TAG_COLORS.map(c => (
                            <button key={c.hex} title={c.label} className="w-6 h-6 rounded-full border border-slate-300 hover:scale-125 hover:shadow-md transition-all" style={{backgroundColor: c.hex}} onClick={(e) => { e.stopPropagation(); e.preventDefault(); onColorChange?.(Number(p.id), c.hex); }} />
                        ))}
                        <button title="Remover Cor" className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-xs text-slate-500 hover:bg-red-50 hover:text-red-500" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onColorChange?.(Number(p.id), null); }}>X</button>
                    </PopoverContent>
                </Popover>

                <button onClick={(e) => { e.stopPropagation(); onMarkAsPaid && onMarkAsPaid(Number(p.id)); }} className={`p-1.5 rounded transition-colors ${isPaid ? 'text-slate-300' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`} title="Pagar"><DollarSign className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); onOpenLuggage && onOpenLuggage(p); }} className={`p-1.5 rounded transition-colors relative ${hasLuggage ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Bagagens"><Briefcase className="w-4 h-4" />{hasLuggage && <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-blue-600 text-white text-[8px] flex items-center justify-center rounded-full px-0.5 border border-white font-bold">{luggageCount}</span>}</button>
                <button onClick={(e) => { e.stopPropagation(); onEdit && onEdit(p); }} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(p); }} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ... DraggableGroup (MANTIDO) ...
function DraggableGroup({ group, isOverlay = false, onMarkAsPaid, onEdit, onOpenLuggage, onDelete, onColorChange, onLink, onUnlink, previousGroupLastItem }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id, data: { type: 'GROUP', group } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 999 : 'auto' };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`touch-none outline-none ${isOverlay ? 'shadow-2xl scale-105 opacity-90' : ''}`}>
      {group.items?.map((p: any, index: number) => {
         let position: 'single' | 'head' | 'middle' | 'tail' = 'single';
         if (group.items.length > 1) {
             if (index === 0) position = 'head'; else if (index === group.items.length - 1) position = 'tail'; else position = 'middle';
         }
         const prevContext = index === 0 ? previousGroupLastItem : null;
         return <PassageiroVisualItem key={p.id} passageiro={p} groupPosition={position} onMarkAsPaid={onMarkAsPaid} onEdit={onEdit} onOpenLuggage={onOpenLuggage} onDelete={onDelete} onColorChange={onColorChange} onLink={onLink} onUnlink={onUnlink} previousInContext={prevContext} />;
      })}
    </div>
  );
}

// ... BairroCard (MANTIDO) ...
function BairroCard({ bairro, isOverlay = false, ...props }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bairro.id, data: { type: 'BAIRRO', bairro } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  
  const isGenericHeader = bairro.nome === 'Geral' || bairro.nome === 'Passageiros';

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border rounded-lg overflow-hidden mb-3 ${isOverlay ? 'shadow-2xl border-blue-500 rotate-1 z-40' : 'shadow-sm border-slate-200'}`}>
      {!isGenericHeader && (
          <div {...attributes} {...listeners} className="bg-slate-50 p-2 border-b border-slate-100 flex justify-between items-center cursor-grab active:cursor-grabbing group">
            <div className="flex items-center gap-2 px-1"><MapPin className="w-3.5 h-3.5 text-slate-500"/><span className="font-bold text-slate-700 text-xs uppercase tracking-wider">{bairro.nome}</span></div>
            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
          </div>
      )}
      <div className={isGenericHeader ? "p-0" : "flex flex-col min-h-[10px] p-2 bg-slate-50/50"}>
        <SortableContext items={bairro.groups?.map((g: any) => g.id) || []} strategy={verticalListSortingStrategy}>
          {bairro.groups?.map((group: any, gIndex: number) => {
             const prevGroup = gIndex > 0 ? bairro.groups[gIndex - 1] : null;
             const prevItem = prevGroup ? prevGroup.items[prevGroup.items.length - 1] : null;
             return <DraggableGroup key={group.id} group={group} previousGroupLastItem={prevItem} {...props} />;
          })}
        </SortableContext>
      </div>
    </div>
  );
}

// ... CidadeContainer (MANTIDO) ...
function CidadeContainer({ cidade, isOverlay = false, ...props }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cidade.id, data: { type: 'CIDADE', cidade } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const totalPax = cidade.bairros?.reduce((acc: number, b: any) => acc + (b.groups?.reduce((gAcc: number, g: any) => gAcc + g.items.length, 0) || 0), 0) || 0;
  
  const isDefaultMode = cidade.id === 'root-padrao';
  const headerIcon = isDefaultMode ? <User className="w-4 h-4 text-slate-500" /> : <div className="w-1.5 h-6 bg-orange-500 rounded-full shadow-sm"></div>;

  return (
    <div ref={setNodeRef} style={style} className={`p-4 rounded-xl border mb-6 ${isOverlay ? 'bg-slate-100 shadow-2xl border-blue-500 z-30' : 'bg-slate-100/50 border-slate-200 shadow-sm'}`}>
      <div {...attributes} {...listeners} className="mb-4 flex items-center justify-between cursor-grab active:cursor-grabbing pb-2 border-b border-slate-200 group">
        <div className="flex items-center gap-3">
            {headerIcon}
            <h2 className="font-black text-lg text-slate-800 uppercase tracking-wide">{cidade.nome}</h2>
            <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">{totalPax} PAX</span>
        </div>
        <GripVertical className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
      </div>
      <SortableContext items={cidade.bairros?.map((b: any) => b.id) || []} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">{cidade.bairros?.map((b: any) => <BairroCard key={b.id} bairro={b} {...props} />)}</div>
      </SortableContext>
    </div>
  );
}

// ... PassengerOrganizer (MANTIDO) ...
export default function PassengerOrganizer({ data, onChange, ...props }: PassengerOrganizerProps) {
  const [activeItem, setActiveItem] = useState<any | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function handleDragStart(event: DragStartEvent) { setActiveItem(event.active.data.current); }
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over || active.id === over.id) return;
    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;
    if (activeType !== overType) return;
    let newData = [...data];
    if (activeType === 'CIDADE') {
        const oldIndex = newData.findIndex((c) => c.id === active.id);
        const newIndex = newData.findIndex((c) => c.id === over.id);
        onChange(arrayMove(newData, oldIndex, newIndex)); return;
    }
    if (activeType === 'BAIRRO') {
      newData = newData.map((cidade) => {
        const bairroAtivo = cidade.bairros.find(b => b.id === active.id);
        const bairroAlvo = cidade.bairros.find(b => b.id === over.id);
        if (bairroAtivo && bairroAlvo) {
          const oldIndex = cidade.bairros.indexOf(bairroAtivo);
          const newIndex = cidade.bairros.indexOf(bairroAlvo);
          return { ...cidade, bairros: arrayMove(cidade.bairros, oldIndex, newIndex) };
        } return cidade;
      }); onChange(newData); return;
    }
    if (activeType === 'GROUP') {
      newData = newData.map((cidade) => {
        const novosBairros = cidade.bairros.map((bairro) => {
           const grupoAtivo = bairro.groups.find(g => g.id === active.id);
           const grupoAlvo = bairro.groups.find(g => g.id === over.id);
           if (grupoAtivo && grupoAlvo) {
             const oldIndex = bairro.groups.indexOf(grupoAtivo);
             const newIndex = bairro.groups.indexOf(grupoAlvo);
             return { ...bairro, groups: arrayMove(bairro.groups, oldIndex, newIndex) };
           } return bairro;
        }); return { ...cidade, bairros: novosBairros };
      }); onChange(newData);
    }
  }
  const dropAnimationConfig: DropAnimation = { sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
      <SortableContext items={data.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col">
          {data.map((cidade) => <CidadeContainer key={cidade.id} cidade={cidade} {...props} />)}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeItem ? (
            activeItem.type === 'CIDADE' ? <CidadeContainer cidade={activeItem.cidade} isOverlay {...props} /> :
            activeItem.type === 'BAIRRO' ? <BairroCard bairro={activeItem.bairro} isOverlay {...props} /> :
            activeItem.type === 'GROUP' ? <DraggableGroup group={activeItem.group} isOverlay {...props} /> : null
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}