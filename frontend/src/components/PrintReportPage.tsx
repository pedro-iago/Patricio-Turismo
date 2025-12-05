import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Printer, ArrowLeft, X, Filter, List, Check, ChevronsUpDown } from 'lucide-react';
import api from '../services/api';
import { Skeleton } from './ui/skeleton';

// --- Imports do PDF ---
import { PDFViewer } from '@react-pdf/renderer';
import { TripReportPDF } from './reports/TripReportPDF';
import { SimplePassengerListPDF } from './reports/SimplePassengerListPDF';

// --- Imports para o Combobox (Busca) ---
import { cn } from './ui/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

// --- COMPONENTE INTERNO DE BUSCA (COMBOBOX) ---
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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`${width} justify-between bg-white h-9 text-xs font-normal`}
        >
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
              <CommandItem
                value="todos"
                onSelect={() => {
                  onChange("todos");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "todos" ? "opacity-100" : "opacity-0"
                  )}
                />
                Todos (Limpar)
              </CommandItem>

              {options.map((option: any) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- Interfaces ---
interface Bus { 
  id: number; 
  modelo: string; 
  placa: string; 
  capacidadePassageiros: number; 
}

interface TripDto { 
  id: number; 
  dataHoraPartida: string; 
  dataHoraChegada: string; 
  onibus: Bus[]; 
}

interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Address { id: number; cidade?: string; bairro?: string; logradouro?: string; numero?: string; }
interface Bagagem { id: number; descricao: string; }

interface PassengerData { 
  id: number;
  onibusId?: number;
  pessoa: { nome: string; cpf?: string; telefone?: string; telefones?: string[] };
  taxista?: Affiliate;
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
  bagagens?: Bagagem[];
  luggageCount?: number;
  valor?: number;
  pago?: boolean;
  numeroAssento?: string;
  [key: string]: any; 
} 

interface PackageData { 
  id: number;
  descricao: string;
  remetente: { id: number; nome: string };
  destinatario: { id: number; nome: string };
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
  valor?: number;
  pago?: boolean;
  [key: string]: any; 
}

export default function PrintReportPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripDto | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterBusId, setFilterBusId] = useState<string>("todos");
  const [filterTaxista, setFilterTaxista] = useState<string>("todos");
  const [filterComisseiro, setFilterComisseiro] = useState<string>("todos");
  const [filterCidade, setFilterCidade] = useState<string>("todos");
  const [filterBairro, setFilterBairro] = useState<string>("todos");

  const [printMode, setPrintMode] = useState<'FULL' | 'SIMPLE'>('FULL');
  const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());

  // --- Busca de Dados ---
  useEffect(() => {
    const fetchAllData = async () => {
      if (!tripId) { setLoading(false); return; }
      setLoading(true);
      
      try {
        const tripRes = await api.get<TripDto>(`/api/viagem/${tripId}`);
        const fetchedTrip = tripRes.data;
        setTrip(fetchedTrip);
        
        const bMap = new Map<number, Bus>();
        if (fetchedTrip.onibus) {
            fetchedTrip.onibus.forEach(b => bMap.set(b.id, b));
        }
        setBusMap(bMap);
        
        const [passengersRes, packagesRes] = await Promise.all([
          api.get(`/api/v1/reports/passageiros/viagem/${tripId}`),
          api.get(`/api/v1/reports/encomendas/viagem/${tripId}`),
        ]);

        const passengersData: PassengerData[] = passengersRes.data;
        
        const passengersWithLuggage = await Promise.all(
          passengersData.map(async (passenger) => {
            if (!passenger || typeof passenger.id === 'undefined') return passenger;
            try {
              const luggageResponse = await api.get(`/api/bagagem/passageiro/${passenger.id}`);
              return { 
                  ...passenger, 
                  bagagens: luggageResponse.data, 
                  luggageCount: luggageResponse.data.length 
              };
            } catch {
              return { ...passenger, bagagens: [], luggageCount: 0 };
            }
          })
        );
        
        setPassengers(passengersWithLuggage);
        setPackages(packagesRes.data);

      } catch (error) { 
        console.error('Erro ao buscar dados para impressão:', error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchAllData();
  }, [tripId]);

  // --- OPÇÕES PARA OS FILTROS ---
  const busOptions = useMemo(() => {
    if (!trip?.onibus) return [];
    return trip.onibus.map(b => ({ value: String(b.id), label: b.placa }));
  }, [trip]);

  const taxistaOptions = useMemo(() => {
      const pList = passengers.flatMap(p => [p.taxista?.pessoa?.nome, p.taxistaColeta?.pessoa?.nome, p.taxistaEntrega?.pessoa?.nome]);
      const pkgList = packages.flatMap(p => [p.taxistaColeta?.pessoa?.nome, p.taxistaEntrega?.pessoa?.nome]);
      const list = Array.from(new Set([...pList, ...pkgList].filter(Boolean))).sort();
      return list.map(item => ({ value: item as string, label: item as string }));
  }, [passengers, packages]);

  const comisseiroOptions = useMemo(() => {
      const pList = passengers.map(p => p.comisseiro?.pessoa?.nome);
      const pkgList = packages.map(p => p.comisseiro?.pessoa?.nome);
      const list = Array.from(new Set([...pList, ...pkgList].filter(Boolean))).sort();
      return list.map(item => ({ value: item as string, label: item as string }));
  }, [passengers, packages]);

  const cidadeOptions = useMemo(() => {
      const getCities = (addr?: Address) => addr?.cidade;
      const allCities = [
          ...passengers.flatMap(p => [getCities(p.enderecoColeta), getCities(p.enderecoEntrega)]),
          ...packages.flatMap(p => [getCities(p.enderecoColeta), getCities(p.enderecoEntrega)])
      ];
      const list = Array.from(new Set(allCities.filter(Boolean))).sort();
      return list.map(item => ({ value: item as string, label: item as string }));
  }, [passengers, packages]);

  const bairroOptions = useMemo(() => {
      const getBairros = (addr?: Address) => addr?.bairro;
      const allBairros = [
          ...passengers.flatMap(p => [getBairros(p.enderecoColeta), getBairros(p.enderecoEntrega)]),
          ...packages.flatMap(p => [getBairros(p.enderecoColeta), getBairros(p.enderecoEntrega)])
      ];
      const list = Array.from(new Set(allBairros.filter(Boolean))).sort();
      return list.map(item => ({ value: item as string, label: item as string }));
  }, [passengers, packages]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredPassengers = useMemo(() => {
      return passengers.filter(p => {
          if (filterBusId !== "todos" && String(p.onibusId) !== filterBusId) return false;
          if (filterTaxista !== "todos") {
              const matches = p.taxista?.pessoa?.nome === filterTaxista ||
                              p.taxistaColeta?.pessoa?.nome === filterTaxista ||
                              p.taxistaEntrega?.pessoa?.nome === filterTaxista;
              if (!matches) return false;
          }
          if (filterComisseiro !== "todos" && p.comisseiro?.pessoa?.nome !== filterComisseiro) return false;
          if (filterCidade !== "todos") {
              const matches = p.enderecoColeta?.cidade === filterCidade || p.enderecoEntrega?.cidade === filterCidade;
              if (!matches) return false;
          }
          if (filterBairro !== "todos") {
              const matches = p.enderecoColeta?.bairro === filterBairro || p.enderecoEntrega?.bairro === filterBairro;
              if (!matches) return false;
          }
          return true;
      });
  }, [passengers, filterBusId, filterTaxista, filterComisseiro, filterCidade, filterBairro]);

  const filteredPackages = useMemo(() => {
      if (filterBusId !== "todos") return []; 

      return packages.filter(p => {
          if (filterTaxista !== "todos") {
              const matches = p.taxistaColeta?.pessoa?.nome === filterTaxista ||
                              p.taxistaEntrega?.pessoa?.nome === filterTaxista;
              if (!matches) return false;
          }
          if (filterComisseiro !== "todos" && p.comisseiro?.pessoa?.nome !== filterComisseiro) return false;
          if (filterCidade !== "todos") {
              const matches = p.enderecoColeta?.cidade === filterCidade || p.enderecoEntrega?.cidade === filterCidade;
              if (!matches) return false;
          }
          if (filterBairro !== "todos") {
              const matches = p.enderecoColeta?.bairro === filterBairro || p.enderecoEntrega?.bairro === filterBairro;
              if (!matches) return false;
          }
          return true;
      });
  }, [packages, filterBusId, filterTaxista, filterComisseiro, filterCidade, filterBairro]);

  const resetFilters = () => {
      setFilterBusId("todos");
      setFilterTaxista("todos");
      setFilterComisseiro("todos");
      setFilterCidade("todos");
      setFilterBairro("todos");
  };
  
  const hasActiveFilters = filterBusId !== 'todos' || filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterCidade !== 'todos' || filterBairro !== 'todos';
  
  // Calcula o texto do ônibus para o cabeçalho do PDF Simples
  const busInfo = filterBusId !== "todos"
      ? (() => { const b = busMap.get(Number(filterBusId)); return b ? `${b.placa} - ${b.modelo}` : 'Ônibus Selecionado'; })()
      : (trip?.onibus && trip.onibus.length > 0 ? trip.onibus.map(b => `${b.placa} - ${b.modelo}`).join(', ') : 'Todos os Ônibus');

  if (loading) {
    return (
      <div className="p-10 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!trip) {
    return <div className="p-10">Viagem não encontrada.</div>;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col h-screen overflow-hidden">
      
      {/* --- BARRA DE FERRAMENTAS --- */}
      <div className="bg-gray-100 border-b border-gray-200 p-4 shadow-sm z-10">
          <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4 w-full xl:w-auto">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Voltar">
                      <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-lg font-semibold flex items-center gap-2 whitespace-nowrap">
                      <Filter className="w-4 h-4" /> Relatórios
                  </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                  
                  {/* Comboboxes de Filtro */}
                  {trip.onibus && trip.onibus.length > 0 && (
                      <FilterCombobox options={busOptions} value={filterBusId} onChange={setFilterBusId} placeholder="Ônibus" />
                  )}
                  <FilterCombobox options={taxistaOptions} value={filterTaxista} onChange={setFilterTaxista} placeholder="Taxista" />
                  <FilterCombobox options={comisseiroOptions} value={filterComisseiro} onChange={setFilterComisseiro} placeholder="Comisseiro" />
                  <FilterCombobox options={cidadeOptions} value={filterCidade} onChange={setFilterCidade} placeholder="Cidade" />
                  <FilterCombobox options={bairroOptions} value={filterBairro} onChange={setFilterBairro} placeholder="Bairro" />
                  
                  {hasActiveFilters && (
                      <Button variant="ghost" size="icon" onClick={resetFilters} className="text-red-500 h-9 w-9" title="Limpar Filtros">
                          <X className="w-4 h-4" />
                      </Button>
                  )}

                  <div className="h-6 w-px bg-gray-300 mx-2 hidden xl:block" />
                  
                  {/* BOTÕES DE TROCA DE MODO */}
                  <Button 
                    onClick={() => setPrintMode('SIMPLE')} 
                    variant={printMode === 'SIMPLE' ? 'default' : 'outline'}
                    className="gap-2 w-full xl:w-auto h-9"
                  >
                      <List className="w-4 h-4" /> Lista Simples
                  </Button>

                  <Button 
                    onClick={() => setPrintMode('FULL')} 
                    variant={printMode === 'FULL' ? 'default' : 'outline'}
                    className={printMode === 'FULL' ? "bg-orange-500 hover:bg-orange-600 text-white gap-2 w-full xl:w-auto h-9" : "gap-2 w-full xl:w-auto h-9"}
                  >
                      <Printer className="w-4 h-4" /> Relatório Completo
                  </Button>
              </div>
          </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL (VISUALIZADOR PDF) --- */}
      <div className="flex-1 bg-gray-500 w-full relative">
        
        {/* MODO 1: RELATÓRIO COMPLETO */}
        {printMode === 'FULL' && (
             <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                 <TripReportPDF 
                    trip={trip} 
                    passengers={filteredPassengers} 
                    packages={filteredPackages} 
                 />
             </PDFViewer>
        )}

        {/* MODO 2: LISTA SIMPLES */}
        {printMode === 'SIMPLE' && (
            <PDFViewer width="100%" height="100%" className="w-full h-full border-none">
                <SimplePassengerListPDF 
                   trip={trip}
                   passengers={filteredPassengers}
                   busInfo={busInfo}
                />
            </PDFViewer>
        )}
      </div>
    </div>
  );
}