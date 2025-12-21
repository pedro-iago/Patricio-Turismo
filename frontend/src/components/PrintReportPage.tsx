import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Printer, ArrowLeft, X, Filter, List, Check, ChevronsUpDown, Map as MapIcon, Car, User } from 'lucide-react';
import api from '../services/api';
import { Skeleton } from './ui/skeleton';

import { PDFViewer } from '@react-pdf/renderer';
import { TripReportPDF } from './reports/TripReportPDF';
import { SimplePassengerListPDF } from './reports/SimplePassengerListPDF';

import { cn } from './ui/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// --- FUNÇÕES DE AJUDA ---
export const normalizeForSorting = (str?: string) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export const sanitizeBairro = (bairro?: string) => {
    if (!bairro || bairro.trim() === '') return 'GERAL';
    const normalized = normalizeForSorting(bairro);
    if (normalized === 'geral') return 'GERAL';
    return bairro.trim().toUpperCase();
};

// --- COMPONENTE DE FILTRO ---
const FilterCombobox = ({ options, value, onChange, placeholder, width = "w-[140px]" }: any) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(() => {
    if (!value || value === 'todos') return placeholder;
    const found = options.find((opt: any) => opt.value === value);
    return found ? found.label : value;
  }, [value, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={`${width} justify-between bg-white h-9 text-xs font-normal`}>
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder}...`} />
          <CommandList>
            <CommandEmpty>Não encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="todos" onSelect={() => { onChange("todos"); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", value === "todos" ? "opacity-100" : "opacity-0")} />Todos (Limpar)</CommandItem>
              {options.map((option: any) => (<CommandItem key={option.value} value={option.label} onSelect={() => { onChange(option.value); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />{option.label}</CommandItem>))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- INTERFACES ---
interface Bus { id: number; modelo: string; placa: string; capacidadePassageiros: number; }
interface TripDto { id: number; dataHoraPartida: string; dataHoraChegada: string; onibus: Bus[]; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Address { id: number; cidade?: string; bairro?: string; logradouro?: string; numero?: string; }
interface Bagagem { id: number; descricao: string; }
interface PassengerData { 
  id: number; onibusId?: number; pessoa: { nome: string; cpf?: string; telefone?: string; telefones?: string[] };
  taxista?: Affiliate; taxistaColeta?: Affiliate; taxistaEntrega?: Affiliate; comisseiro?: Affiliate;
  enderecoColeta?: Address; enderecoEntrega?: Address; bagagens?: Bagagem[]; luggageCount?: number;
  valor?: number; pago?: boolean; numeroAssento?: string; ordem?: number; grupoId?: string; [key: string]: any; 
} 
interface PackageData { id: number; descricao: string; remetente: { id: number; nome: string }; destinatario: { id: number; nome: string }; taxistaColeta?: Affiliate; taxistaEntrega?: Affiliate; comisseiro?: Affiliate; enderecoColeta?: Address; enderecoEntrega?: Address; valor?: number; pago?: boolean; [key: string]: any; }

export default function PrintReportPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [trip, setTrip] = useState<TripDto | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filterBusId, setFilterBusId] = useState<string>("todos");
  const [filterTaxista, setFilterTaxista] = useState<string>("todos");
  const [filterComisseiro, setFilterComisseiro] = useState<string>("todos");
  const [filterCidade, setFilterCidade] = useState<string>("todos");
  const [filterBairro, setFilterBairro] = useState<string>("todos");

  const [printMode, setPrintMode] = useState<'FULL' | 'SIMPLE'>('FULL');
  const [organizeMode, setOrganizeMode] = useState<'padrao' | 'cidade' | 'taxista' | 'comisseiro'>('padrao');
  const [cityGroupBy, setCityGroupBy] = useState<'coleta' | 'entrega'>('coleta');
  
  const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());

  // === FETCH DE DADOS ===
  useEffect(() => {
    const fetchAllData = async () => {
      if (!tripId) { setLoading(false); return; }
      setLoading(true);
      
      const modeParam = searchParams.get('mode');
      const groupParam = searchParams.get('groupBy');
      if (modeParam === 'cidade' || modeParam === 'taxista' || modeParam === 'comisseiro') setOrganizeMode(modeParam as any);
      if (groupParam === 'entrega') setCityGroupBy('entrega');

      try {
        const tripRes = await api.get<TripDto>(`/api/viagem/${tripId}`);
        setTrip(tripRes.data);
        const bMap = new Map<number, Bus>();
        if (tripRes.data.onibus) tripRes.data.onibus.forEach(b => bMap.set(b.id, b));
        setBusMap(bMap);
        
        const [passengersRes, packagesRes] = await Promise.all([
          api.get(`/api/v1/reports/passageiros/viagem/${tripId}`),
          api.get(`/api/v1/reports/encomendas/viagem/${tripId}`),
        ]);
        
        const passengersData: PassengerData[] = passengersRes.data;
        const passengersWithDetails = await Promise.all(
            passengersData.map(async (p: any) => {
                let bagagens: Bagagem[] = p.bagagens || p.volumes || [];
                if (!bagagens.length) {
                    try {
                        const bagRes = await api.get(`/api/bagagem/passageiro/${p.id}`);
                        bagagens = bagRes.data;
                    } catch (e) { bagagens = []; }
                }
                return { ...p, bagagens, luggageCount: bagagens.length };
            })
        );
        setPassengers(passengersWithDetails);
        setPackages(packagesRes.data);
      } catch (error) { console.error('Erro:', error); } finally { setLoading(false); }
    };
    fetchAllData();
  }, [tripId, searchParams]);

  // Opções de Filtro
  const busOptions = useMemo(() => trip?.onibus ? trip.onibus.map(b => ({ value: String(b.id), label: b.placa })) : [], [trip]);
  const taxistaOptions = useMemo(() => Array.from(new Set(passengers.flatMap(p => [p.taxista?.pessoa?.nome, p.taxistaColeta?.pessoa?.nome, p.taxistaEntrega?.pessoa?.nome]).concat(packages.flatMap(p => [p.taxistaColeta?.pessoa?.nome, p.taxistaEntrega?.pessoa?.nome])).filter(Boolean))).sort().map(i => ({ value: i as string, label: i as string })), [passengers, packages]);
  const comisseiroOptions = useMemo(() => Array.from(new Set(passengers.map(p => p.comisseiro?.pessoa?.nome).concat(packages.map(p => p.comisseiro?.pessoa?.nome)).filter(Boolean))).sort().map(i => ({ value: i as string, label: i as string })), [passengers, packages]);
  const cidadeOptions = useMemo(() => Array.from(new Set([...passengers.flatMap(p => [p.enderecoColeta?.cidade, p.enderecoEntrega?.cidade]), ...packages.flatMap(p => [p.enderecoColeta?.cidade, p.enderecoEntrega?.cidade])].filter(Boolean))).sort().map(i => ({ value: i as string, label: i as string })), [passengers, packages]);
  const bairroOptions = useMemo(() => Array.from(new Set([...passengers.flatMap(p => [p.enderecoColeta?.bairro, p.enderecoEntrega?.bairro]), ...packages.flatMap(p => [p.enderecoColeta?.bairro, p.enderecoEntrega?.bairro])].filter(Boolean))).sort().map(i => ({ value: i as string, label: i as string })), [passengers, packages]);

  // Filtragem
  const filteredPassengers = useMemo(() => {
      return passengers.filter(p => {
          if (filterBusId !== "todos" && String(p.onibusId) !== filterBusId) return false;
          if (filterTaxista !== "todos" && !(p.taxista?.pessoa?.nome === filterTaxista || p.taxistaColeta?.pessoa?.nome === filterTaxista || p.taxistaEntrega?.pessoa?.nome === filterTaxista)) return false;
          if (filterComisseiro !== "todos" && p.comisseiro?.pessoa?.nome !== filterComisseiro) return false;
          if (filterCidade !== "todos" && !(p.enderecoColeta?.cidade === filterCidade || p.enderecoEntrega?.cidade === filterCidade)) return false;
          if (filterBairro !== "todos" && !(p.enderecoColeta?.bairro === filterBairro || p.enderecoEntrega?.bairro === filterBairro)) return false;
          return true;
      });
  }, [passengers, filterBusId, filterTaxista, filterComisseiro, filterCidade, filterBairro]);

  const filteredPackages = useMemo(() => {
      if (filterBusId !== "todos") return [];
      return packages.filter(p => {
           if (filterTaxista !== "todos" && !(p.taxistaColeta?.pessoa?.nome === filterTaxista || p.taxistaEntrega?.pessoa?.nome === filterTaxista)) return false;
           if (filterComisseiro !== "todos" && p.comisseiro?.pessoa?.nome !== filterComisseiro) return false;
           if (filterCidade !== "todos" && !(p.enderecoColeta?.cidade === filterCidade || p.enderecoEntrega?.cidade === filterCidade)) return false;
           if (filterBairro !== "todos" && !(p.enderecoColeta?.bairro === filterBairro || p.enderecoEntrega?.bairro === filterBairro)) return false;
           return true;
      });
  }, [packages, filterBusId, filterTaxista, filterComisseiro, filterCidade, filterBairro]);

  // --- LÓGICA DE ORDENAÇÃO FUNDAMENTAL PARA O PDF ---
  const organizedPassengers = useMemo(() => {
    const list = [...filteredPassengers];
    
    // MODO PADRÃO: Respeita ordem, mas cola grupos
    if (organizeMode === 'padrao') {
        return list.sort((a, b) => {
            // Se ambos têm grupo e é o mesmo grupo, mantém a ordem relativa entre eles
            if (a.grupoId && b.grupoId && a.grupoId === b.grupoId) {
                return (a.ordem || 0) - (b.ordem || 0);
            }
            // Se são grupos diferentes ou sem grupo, usa a ordem do primeiro elemento do bloco
            return (a.ordem || 0) - (b.ordem || 0);
        });
    }

    return list.sort((a, b) => {
        if (organizeMode === 'cidade') {
            const addrA = cityGroupBy === 'coleta' ? a.enderecoColeta : a.enderecoEntrega;
            const addrB = cityGroupBy === 'coleta' ? b.enderecoColeta : b.enderecoEntrega;

            const cityA = normalizeForSorting(addrA?.cidade);
            const cityB = normalizeForSorting(addrB?.cidade);
            
            if (cityA !== cityB) return cityA.localeCompare(cityB);

            const bairroA = sanitizeBairro(addrA?.bairro);
            const bairroB = sanitizeBairro(addrB?.bairro);
            
            if (bairroA !== bairroB) return bairroA.localeCompare(bairroB);
        } else if (organizeMode === 'taxista') {
             const tA = normalizeForSorting(a.taxistaColeta?.pessoa?.nome);
             const tB = normalizeForSorting(b.taxistaColeta?.pessoa?.nome);
             if (tA !== tB) return tA.localeCompare(tB);
        } else if (organizeMode === 'comisseiro') {
             const cA = normalizeForSorting(a.comisseiro?.pessoa?.nome);
             const cB = normalizeForSorting(b.comisseiro?.pessoa?.nome);
             if (cA !== cB) return cA.localeCompare(cB);
        }
        // Desempate pela ordem original
        return (a.ordem || 0) - (b.ordem || 0);
    });
  }, [filteredPassengers, organizeMode, cityGroupBy]); 

  const resetFilters = () => { setFilterBusId("todos"); setFilterTaxista("todos"); setFilterComisseiro("todos"); setFilterCidade("todos"); setFilterBairro("todos"); };
  const hasActiveFilters = filterBusId !== 'todos' || filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterCidade !== 'todos' || filterBairro !== 'todos';
  const busInfo = filterBusId !== "todos" ? (() => { const b = busMap.get(Number(filterBusId)); return b ? `${b.placa} - ${b.modelo}` : 'Ônibus Selecionado'; })() : (trip?.onibus && trip.onibus.length > 0 ? trip.onibus.map(b => `${b.placa} - ${b.modelo}`).join(', ') : 'Todos os Ônibus');

  if (loading) return <div className="p-10 space-y-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-32 w-full" /></div>;
  if (!trip) return <div className="p-10">Viagem não encontrada.</div>;

  return (
    <div className="min-h-screen bg-white flex flex-col h-screen overflow-hidden">
      {/* BARRA DE TOPO */}
      <div className="bg-gray-100 border-b border-gray-200 p-4 shadow-sm z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
              <h2 className="text-lg font-semibold flex items-center gap-2 whitespace-nowrap"><Filter className="w-4 h-4" /> Relatórios de Impressão</h2>
          </div>

          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
               {/* FILTROS */}
               <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  {trip.onibus && trip.onibus.length > 0 && (<FilterCombobox options={busOptions} value={filterBusId} onChange={setFilterBusId} placeholder="Ônibus" />)}
                  <FilterCombobox options={taxistaOptions} value={filterTaxista} onChange={setFilterTaxista} placeholder="Taxista" />
                  <FilterCombobox options={comisseiroOptions} value={filterComisseiro} onChange={setFilterComisseiro} placeholder="Comisseiro" />
                  <FilterCombobox options={cidadeOptions} value={filterCidade} onChange={setFilterCidade} placeholder="Cidade" />
                  {hasActiveFilters && (<Button variant="ghost" size="icon" onClick={resetFilters} className="text-red-500 h-9 w-9"><X className="w-4 h-4" /></Button>)}
               </div>

               <div className="h-6 w-px bg-gray-300 mx-2 hidden xl:block" />

               {/* BOTÕES DE MODO */}
               <div className="flex items-center bg-white p-1 rounded-md border border-gray-200 overflow-x-auto">
                    <span className="text-[10px] font-bold uppercase text-gray-500 whitespace-nowrap px-2">Agrupar:</span>
                    <Button variant={organizeMode === 'padrao' ? 'secondary' : 'ghost'} size="sm" onClick={() => setOrganizeMode('padrao')} className="h-7 text-xs gap-1"><List className="w-3 h-3"/> Padrão</Button>
                    <Button variant={organizeMode === 'taxista' ? 'secondary' : 'ghost'} size="sm" onClick={() => setOrganizeMode('taxista')} className="h-7 text-xs gap-1"><Car className="w-3 h-3"/> Taxista</Button>
                    <Button variant={organizeMode === 'comisseiro' ? 'secondary' : 'ghost'} size="sm" onClick={() => setOrganizeMode('comisseiro')} className="h-7 text-xs gap-1"><User className="w-3 h-3"/> Comis.</Button>
                    
                    <div className="flex items-center border-l border-gray-200 pl-1 ml-1 gap-1">
                        <Button variant={organizeMode === 'cidade' ? 'default' : 'ghost'} size="sm" onClick={() => setOrganizeMode('cidade')} className={cn("h-7 text-xs gap-1", organizeMode === 'cidade' && "bg-blue-600 hover:bg-blue-700 text-white")}><MapIcon className="w-3 h-3"/> Por Cidade</Button>
                        {organizeMode === 'cidade' && (
                            <div className="flex bg-gray-100 rounded ml-1 p-0.5">
                                <button onClick={() => setCityGroupBy('coleta')} className={cn("px-2 py-0.5 text-[10px] rounded transition-all font-bold", cityGroupBy === 'coleta' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700")}>Coleta</button>
                                <button onClick={() => setCityGroupBy('entrega')} className={cn("px-2 py-0.5 text-[10px] rounded transition-all font-bold", cityGroupBy === 'entrega' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700")}>Entrega</button>
                            </div>
                        )}
                    </div>
               </div>

               <div className="flex gap-2">
                  <Button onClick={() => setPrintMode('SIMPLE')} variant={printMode === 'SIMPLE' ? 'default' : 'outline'} className="gap-2 h-9 text-xs"><List className="w-4 h-4" /> Lista Simples</Button>
                  <Button onClick={() => setPrintMode('FULL')} variant={printMode === 'FULL' ? 'default' : 'outline'} className={cn("gap-2 h-9 text-xs", printMode === 'FULL' ? "bg-orange-500 hover:bg-orange-600 text-white" : "")}><Printer className="w-4 h-4" /> Completo</Button>
               </div>
          </div>
      </div>

      <div className="flex-1 bg-gray-500 w-full relative">
        {printMode === 'FULL' && (
             <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                 <TripReportPDF 
                    trip={trip} 
                    passengers={organizedPassengers} 
                    packages={filteredPackages} 
                    organizeMode={organizeMode} 
                    groupingType={cityGroupBy} 
                 />
             </PDFViewer>
        )}
        {printMode === 'SIMPLE' && (
            <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                <SimplePassengerListPDF 
                    trip={trip} 
                    passengers={organizedPassengers} 
                    busInfo={busInfo} 
                    organizeMode={organizeMode}
                    groupingType={cityGroupBy}
                />
            </PDFViewer>
        )}
      </div>
    </div>
  );
}