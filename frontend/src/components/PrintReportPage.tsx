import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
// Removido Select, SelectItem, etc.
import { Printer, ArrowLeft, X, Filter, List, Check, ChevronsUpDown } from 'lucide-react';
import api from '../services/api';
import PassengerTable from './PassengerTable';
import PackageTable from './PackageTable';
import { Skeleton } from './ui/skeleton';
import logo from '../assets/logo.png';

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

// --- COMPONENTE SIMPLES DE BUSCA (COMBOBOX) ---
// Colocamos aqui dentro para não criar arquivos extras
const FilterCombobox = ({ options, value, onChange, placeholder, width = "w-[140px]" }: any) => {
  const [open, setOpen] = useState(false);

  // Encontra o label do item selecionado
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
              {/* Opção para Limpar/Todos */}
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

              {/* Lista de Opções */}
              {options.map((option: any) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Filtra pelo nome visível
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
interface Address { id: number; cidade?: string; bairro?: string; }
interface Bagagem { id: number; descricao: string; }

interface PassengerData { 
  id: number;
  onibusId?: number;
  taxista?: Affiliate;
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
  bagagens?: Bagagem[];
  luggageCount?: number;
  [key: string]: any; 
} 

interface PackageData { 
  id: number;
  remetente: { id: number; nome: string };
  destinatario: { id: number; nome: string };
  taxistaColeta?: Affiliate;
  taxistaEntrega?: Affiliate;
  comisseiro?: Affiliate;
  enderecoColeta?: Address;
  enderecoEntrega?: Address;
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

  // --- PREPARAÇÃO DE DADOS PARA OS FILTROS ---
  // Agora retornamos objetos { value, label } para o nosso FilterCombobox

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

  // --- Lógica de Filtragem (Mantida igual) ---
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

  const handlePrintFull = () => {
      setPrintMode('FULL');
      setTimeout(() => window.print(), 100);
  };

  const handlePrintSimple = () => {
      setPrintMode('SIMPLE');
      setTimeout(() => {
          window.print();
          setPrintMode('FULL'); 
      }, 500);
  };

  const resetFilters = () => {
      setFilterBusId("todos");
      setFilterTaxista("todos");
      setFilterComisseiro("todos");
      setFilterCidade("todos");
      setFilterBairro("todos");
  };
  
  const hasActiveFilters = filterBusId !== 'todos' || filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterCidade !== 'todos' || filterBairro !== 'todos';

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

  const busInfo = filterBusId !== "todos"
      ? (() => { const b = busMap.get(Number(filterBusId)); return b ? `${b.placa} - ${b.modelo}` : 'Ônibus Selecionado'; })()
      : (trip.onibus && trip.onibus.length > 0 ? trip.onibus.map(b => `${b.placa} - ${b.modelo}`).join(', ') : 'Nenhum ônibus vinculado');

  return (
    <div className="min-h-screen bg-white">
      
      {/* --- BARRA DE FILTROS --- */}
      <div className="sticky top-0 z-50 bg-gray-100 border-b border-gray-200 p-4 print:hidden shadow-sm">
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
                  
                  {/* Combobox Ônibus */}
                  {trip.onibus && trip.onibus.length > 0 && (
                      <FilterCombobox 
                        options={busOptions} 
                        value={filterBusId} 
                        onChange={setFilterBusId} 
                        placeholder="Ônibus" 
                      />
                  )}

                  {/* Combobox Taxista */}
                  <FilterCombobox 
                    options={taxistaOptions} 
                    value={filterTaxista} 
                    onChange={setFilterTaxista} 
                    placeholder="Taxista" 
                  />

                  {/* Combobox Comisseiro */}
                  <FilterCombobox 
                    options={comisseiroOptions} 
                    value={filterComisseiro} 
                    onChange={setFilterComisseiro} 
                    placeholder="Comisseiro" 
                  />

                  {/* Combobox Cidade */}
                  <FilterCombobox 
                    options={cidadeOptions} 
                    value={filterCidade} 
                    onChange={setFilterCidade} 
                    placeholder="Cidade" 
                  />

                  {/* Combobox Bairro */}
                  <FilterCombobox 
                    options={bairroOptions} 
                    value={filterBairro} 
                    onChange={setFilterBairro} 
                    placeholder="Bairro" 
                  />
                  
                  {hasActiveFilters && (
                      <Button variant="ghost" size="icon" onClick={resetFilters} className="text-red-500 h-9 w-9" title="Limpar Filtros">
                          <X className="w-4 h-4" />
                      </Button>
                  )}

                  <div className="h-6 w-px bg-gray-300 mx-2 hidden xl:block" />
                  
                  <Button onClick={handlePrintSimple} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 gap-2 w-full xl:w-auto h-9">
                      <List className="w-4 h-4" /> Lista Simples
                  </Button>

                  <Button onClick={handlePrintFull} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 w-full xl:w-auto h-9">
                      <Printer className="w-4 h-4" /> Relatório Completo
                  </Button>
              </div>
          </div>
      </div>

      {/* --- MODO 1: RELATÓRIO COMPLETO --- */}
      {printMode === 'FULL' && (
        <div className="p-10 space-y-6 pt-print-container max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
            <img src={logo} alt="Patricio Turismo" className="h-16 w-auto" />
            <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-800">Relatório de Viagem</h1>
                <p className="text-muted-foreground">Bahia ↔ São Paulo</p>
                
                {hasActiveFilters && (
                    <div className="text-xs text-gray-500 mt-2 print:block">
                        <b>Filtros:</b>
                        {filterBusId !== 'todos' && <span className="ml-2">Bus: {busMap.get(Number(filterBusId))?.placa}</span>}
                        {filterTaxista !== 'todos' && <span className="ml-2">| Taxista: {filterTaxista}</span>}
                        {filterComisseiro !== 'todos' && <span className="ml-2">| Comis.: {filterComisseiro}</span>}
                        {filterCidade !== 'todos' && <span className="ml-2">| Cidade: {filterCidade}</span>}
                        {filterBairro !== 'todos' && <span className="ml-2">| Bairro: {filterBairro}</span>}
                    </div>
                )}
            </div>
            </div>
            
            <Card className="border-gray-300 shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Informações Gerais</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 border-b pb-4">
                    <div><p className="text-muted-foreground font-semibold">Data</p><p>{new Date(trip.dataHoraPartida).toLocaleDateString()}</p></div>
                    <div><p className="text-muted-foreground font-semibold">Horários</p><p>{new Date(trip.dataHoraPartida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ➝ {new Date(trip.dataHoraChegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                    <div className="col-span-2"><p className="text-muted-foreground font-semibold">Frota (Exibida)</p><p>{busInfo}</p></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-muted-foreground font-semibold">Passageiros Listados</p><p className="text-lg font-bold">{filteredPassengers.length}</p></div>
                    <div><p className="text-muted-foreground font-semibold">Encomendas Listadas</p><p className="text-lg font-bold">{filteredPackages.length}</p></div>
                </div>
            </CardContent>
            </Card>

            {filteredPassengers.length > 0 ? (
                <div className="mt-8">
                <h3 className="text-lg font-bold mb-2 border-l-4 border-primary pl-2">Lista de Passageiros</h3>
                <PassengerTable passengers={filteredPassengers} loading={loading} isPrintView={true} busMap={busMap} onRefreshData={() => {}} />
                </div>
            ) : (
                <div className="mt-8 p-4 border border-dashed text-center text-gray-400">Nenhum passageiro corresponde aos filtros selecionados.</div>
            )}
            
            {filteredPackages.length > 0 ? (
                <div className="mt-8 break-inside-avoid">
                <h3 className="text-lg font-bold mb-2 border-l-4 border-primary pl-2">Lista de Encomendas</h3>
                <PackageTable packages={filteredPackages} loading={loading} isPrintView={true} />
                </div>
            ) : (
                filterBusId === 'todos' && packages.length > 0 && (
                    <div className="mt-8 p-4 border border-dashed text-center text-gray-400">Nenhuma encomenda corresponde aos filtros selecionados.</div>
                )
            )}

            <div className="fixed bottom-0 left-0 w-full text-center text-xs text-gray-400 p-4 bg-white hidden print:block">
            <p>Gerado em {new Date().toLocaleString()} - Sistema Patrício Turismo</p>
            </div>
        </div>
      )}

      {/* --- MODO 2: LISTA SIMPLES --- */}
      {printMode === 'SIMPLE' && (
          <div className="p-8 pt-print-container max-w-5xl mx-auto font-sans">
              <div className="mb-6 border-b-2 border-black pb-2 flex justify-between items-end">
                  <div>
                      <h1 className="text-2xl font-bold text-black uppercase tracking-wide">Lista de Passageiros</h1>
                      <p className="text-sm text-gray-600 mt-1">
                          {new Date(trip.dataHoraPartida).toLocaleDateString()} - {busInfo}
                      </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                      <p>Viagem #{trip.id}</p>
                      <p>{filteredPassengers.length} Passageiros</p>
                  </div>
              </div>

              <table className="w-full text-sm text-left border-collapse">
                  <thead>
                      <tr className="border-b border-black text-black">
                          <th className="py-2 pr-4 w-12 font-bold">#</th>
                          <th className="py-2 pr-4 font-bold">Nome Completo</th>
                          <th className="py-2 pr-4 font-bold w-48">Documento (CPF)</th>
                          <th className="py-2 pl-4 font-bold w-24 text-center">Assento</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredPassengers.map((p, index) => (
                          <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 pr-4 text-gray-500 font-mono">{index + 1}</td>
                              <td className="py-3 pr-4 font-medium text-gray-900 uppercase">
                                  {p.pessoa.nome}
                              </td>
                              <td className="py-3 pr-4 text-gray-700 font-mono">
                                  {p.pessoa.cpf || '-'}
                              </td>
                              <td className="py-3 pl-4 text-center font-bold text-lg text-gray-900">
                                  {p.numeroAssento || '-'}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              
              <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-center text-gray-400">
                  Patrício Turismo - Lista Simplificada
              </div>
          </div>
      )}

    </div>
  );
}