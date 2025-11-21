import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Printer, FileDown, X, Calendar, Clock, Bus as BusIcon, Users, Package, 
  PanelRightClose, PanelRightOpen, Map as MapIcon, List as ListIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; 
import PassengerModal from './PassengerModal';
import PackageModal from './PackageModal';
import LuggageModal from './LuggageModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { CSVLink } from 'react-csv'; 
import { cn } from './ui/utils';

import PassengerTable from './PassengerTable';
import PackageTable from './PackageTable';
import SeatMap from './SeatMap'; 
import SeatBinderModal from './SeatBinderModal';

// --- Interfaces (MANTIDAS) ---
interface Bus { id: number; modelo: string; placa: string; capacidadePassageiros: number; layoutJson?: string; }
interface TripDto { id: number; dataHoraPartida: string; dataHoraChegada: string; onibus: Bus[]; }
interface Page<T> { content: T[]; } 
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

interface PassengerSaveDto {
  pessoaId: number; enderecoColetaId: number; enderecoEntregaId: number;
  taxistaId?: number; comisseiroId?: number; valor?: number; metodoPagamento?: string; pago?: boolean; assentoId?: number | null;
}
interface PackageSaveDto {
  descricao: string; remetenteId: number; destinatarioId: number; enderecoColetaId: number; enderecoEntregaId: number;
  taxistaId?: number; comisseiroId?: number; valor?: number; metodoPagamento?: string; pago?: boolean;
}

interface PassengerData { 
    id: number; pessoa: { id: number; nome: string; cpf: string; telefone?: string }; 
    enderecoColeta: { id: number; logradouro?: string; bairro?: string; cidade?: string }; 
    enderecoEntrega: { id: number; logradouro?: string; bairro?: string; cidade?: string }; 
    valor?: number; metodoPagamento?: string; pago?: boolean;
    taxista?: Affiliate; comisseiro?: Affiliate;
    assentoId: number | null; numeroAssento?: string; luggageCount?: number; 
    onibusId?: number; 
    onibus?: { id: number }; 
    cidadeDestino?: string; 
    [key: string]: any; 
}
interface PackageData { 
    id: number; descricao: string;
    remetente: { id: number, nome: string; telefone?: string }; destinatario: { id: number, nome: string; telefone?: string };
    enderecoColeta?: { id: number; cidade?: string };
    enderecoEntrega?: { id: number; cidade?: string };
    taxistaColeta?: Affiliate;
    taxistaEntrega?: Affiliate;
    comisseiro?: Affiliate;
    valor?: number; pago?: boolean; 
    [key: string]: any;
}

export default function TripDetailsPage() {
    const { id: tripId } = useParams<{ id: string }>();
    const tripIdNum = parseInt(tripId!); 
    const navigate = useNavigate(); 

    const [trip, setTrip] = useState<TripDto | null>(null);
    const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());
    const [passengers, setPassengers] = useState<PassengerData[]>([]);
    const [packages, setPackages] = useState<PackageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentBusId, setCurrentBusId] = useState<number | null>(null);
    
    // Estado da Barra Lateral (Desktop)
    const [isMapOpen, setIsMapOpen] = useState(true);
    // Estado da Visualização Mobile (Lista ou Mapa)
    const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
    
    // Modais e Ações
    const [isSeatBinderModalOpen, setIsSeatBinderModalOpen] = useState(false);
    const [seatTargetId, setSeatTargetId] = useState<number | null>(null); 
    const [seatTargetNumber, setSeatTargetNumber] = useState('');
    const [passengerToDesassociate, setPassengerToDesassociate] = useState<PassengerData | null>(null); 
    const [availablePassengers, setAvailablePassengers] = useState<PassengerData[]>([]); 
    
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState<PassengerData | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
    const [deleteItem, setDeleteItem] = useState<{ type: 'passenger' | 'package'; item: any } | null>(null);
    
    // Filtros
    const [filterTaxista, setFilterTaxista] = useState<string>("todos");
    const [filterComisseiro, setFilterComisseiro] = useState<string>("todos");
    const [filterOnibus, setFilterOnibus] = useState<string>("todos");
    const [filterCidade, setFilterCidade] = useState<string>("todos");
    const [passengerSearchTerm, setPassengerSearchTerm] = useState('');
    const [packageSearchTerm, setPackageSearchTerm] = useState('');
    
    // --- 1. Busca Inicial ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!tripIdNum || isNaN(tripIdNum)) { setLoading(false); return; }
            setLoading(true);
            try {
                const [tripResponse, taxistasRes, comisseirosRes] = await Promise.all([
                    api.get<TripDto>(`/api/viagem/${tripIdNum}`), 
                    api.get<Page<Affiliate>>('/api/v1/affiliates/taxistas'), 
                    api.get<Page<Affiliate>>('/api/v1/affiliates/comisseiros')
                ]);
                
                const tripData = tripResponse.data;
                setTrip(tripData);

                const newBusMap = new Map<number, Bus>();
                if (tripData.onibus) {
                    tripData.onibus.forEach(bus => newBusMap.set(bus.id, bus));
                    if (tripData.onibus.length > 0) setCurrentBusId(tripData.onibus[0].id);
                }
                setBusMap(newBusMap);
            } catch (error) { 
                 console.error('Erro ao buscar detalhes:', error);
                 setTrip(null); 
            } finally { setLoading(false); }
        };
        fetchInitialData();
    }, [tripIdNum]);

    // --- 2. Busca de Dados ---
    const fetchFilteredData = useCallback(async () => {
        if (!tripIdNum || isNaN(tripIdNum)) return;
        try {
            const [passengersResponse, packagesResponse] = await Promise.all([
                api.get<PassengerData[]>(`/api/v1/reports/passageiros/viagem/${tripIdNum}`), 
                api.get<PackageData[]>(`/api/v1/reports/encomendas/viagem/${tripIdNum}`)     
            ]);
            
            const passengersData = passengersResponse.data;
            const passengersWithLuggage = await Promise.all( 
                passengersData.map(async (passenger) => { 
                    const realOnibusId = passenger.onibusId || (passenger.onibus && passenger.onibus.id);
                    try {
                        const luggageResponse = await api.get(`/api/bagagem/passageiro/${passenger.id}`);
                        return { 
                            ...passenger, 
                            luggageCount: luggageResponse.data.length,
                            onibusId: realOnibusId ? Number(realOnibusId) : null
                        };
                    } catch { 
                        return { 
                            ...passenger, 
                            luggageCount: 0,
                            onibusId: realOnibusId ? Number(realOnibusId) : null
                        }; 
                    }
                })
            );
            setPassengers(passengersWithLuggage);
            setPackages(packagesResponse.data); 
            setAvailablePassengers(passengersWithLuggage.filter(p => !p.numeroAssento));
        } catch (error) { console.error('Erro ao atualizar dados:', error); }
    }, [tripIdNum]);
    
    useEffect(() => { fetchFilteredData(); }, [fetchFilteredData]);

    // --- Lógica de Assentos e CRUD ---
    const handleSelectSeat = (identifier: number, seatNumber: string, isOccupied: boolean) => {
        setSeatTargetId(identifier); 
        setSeatTargetNumber(seatNumber); 
        
        if (isOccupied) {
            let passenger = passengers.find(p => p.id === identifier);
            if (!passenger) {
                console.warn("Passageiro não encontrado por ID, tentando fallback...");
                passenger = passengers.find(p => {
                    const seatA = parseInt(p.numeroAssento || '0', 10);
                    const seatB = parseInt(seatNumber || '0', 10);
                    return seatA === seatB && p.onibusId === currentBusId;
                });
            }
            if (passenger) setPassengerToDesassociate(passenger);
            else alert("Erro ao identificar passageiro.");
        } else {
            setIsSeatBinderModalOpen(true);
        }
    };
    
    const updatePassengerAssento = async (passengerId: number, seatIdentifier: string | null, isUnbind: boolean = false) => {
        if (!currentBusId && !isUnbind) { alert("Erro: Nenhum ônibus selecionado."); return; }
        try {
            const params = new URLSearchParams();
            let busIdToUse = currentBusId;
            if (isUnbind) {
                const p = passengers.find(px => px.id === passengerId);
                if (p && p.onibusId) busIdToUse = p.onibusId;
            }
            if (busIdToUse) params.append('onibusId', busIdToUse.toString());
            if (!isUnbind && seatIdentifier) {
                const cleanNumber = parseInt(seatIdentifier, 10).toString();
                params.append('numero', cleanNumber);
            }
            await api.patch(`/api/passageiroviagem/${passengerId}/vincular-assento?${params.toString()}`);
            setIsSeatBinderModalOpen(false); setPassengerToDesassociate(null); setSeatTargetId(null);
            await fetchFilteredData(); 
        } catch (error) { console.error(error); alert("Erro ao vincular/desvincular assento."); }
    }
    
    const handleBindPassenger = (pid: number) => updatePassengerAssento(pid, seatTargetNumber, false);
    const handleDesassociateConfirm = () => passengerToDesassociate && updatePassengerAssento(passengerToDesassociate.id, null, true);
    
    // --- Mover Passageiros (Não funcional backend ainda, removido visual) ---
    
    const handleSavePassenger = async (dto: PassengerSaveDto) => {
        if (!tripIdNum) return;
        try {
          if (selectedPassenger) await api.put(`/api/passageiroviagem/${selectedPassenger.id}`, { ...dto, viagemId: tripIdNum }); 
          else await api.post('/api/passageiroviagem', { ...dto, viagemId: tripIdNum }); 
          setIsPassengerModalOpen(false); setSelectedPassenger(null); await fetchFilteredData(); 
        } catch (e) { console.error(e); }
    };
    
    const handleSavePackage = async (dto: PackageSaveDto) => {
        if (!tripIdNum) return;
        try {
          if (selectedPackage) await api.put(`/api/encomenda/${selectedPackage.id}`, { ...dto, viagemId: tripIdNum });
          else await api.post('/api/encomenda', { ...dto, viagemId: tripIdNum });
          setIsPackageModalOpen(false); setSelectedPackage(null); await fetchFilteredData(); 
        } catch (e) { console.error(e); }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;
        try {
            if (deleteItem.type === 'passenger') await api.delete(`/api/passageiroviagem/${deleteItem.item.id}`); 
            else await api.delete(`/api/encomenda/${deleteItem.item.id}`);
            setDeleteItem(null); await fetchFilteredData(); 
        } catch (e) { console.error(e); }
    };

    const handleMarkAsPaid = async (type: 'passenger' | 'package', id: number) => {
        const url = type === 'passenger' ? `/api/passageiroviagem/${id}/marcar-pago` : `/api/encomenda/${id}/marcar-pago`;
        try { await api.patch(url); await fetchFilteredData(); } catch (e) { console.error(e); }
    };
      
    // --- Filtros ---
    const uniqueTaxistas = useMemo(() => Array.from(new Set(passengers.map(p => p.taxista?.pessoa?.nome).concat(packages.flatMap(p => [p.taxistaColeta?.pessoa?.nome, p.taxistaEntrega?.pessoa?.nome])).filter(Boolean))), [passengers, packages]);
    const uniqueComisseiros = useMemo(() => Array.from(new Set(passengers.map(p => p.comisseiro?.pessoa?.nome).concat(packages.map(p => p.comisseiro?.pessoa?.nome)).filter(Boolean))), [passengers, packages]);
    const uniqueCidades = useMemo(() => Array.from(new Set(passengers.map(p => p.cidadeDestino || (p.enderecoEntrega as any)?.cidade).concat(packages.flatMap(p => [p.enderecoColeta?.cidade, p.enderecoEntrega?.cidade])).filter(Boolean))), [passengers, packages]);
    const uniqueOnibusIds = useMemo(() => Array.from(new Set(passengers.map(p => p.onibusId).filter(Boolean))), [passengers]);

    const filteredPassengers = useMemo(() => {
        return passengers.filter((passenger) => {
            const searchLower = passengerSearchTerm.toLowerCase();
            const matchesSearch = !searchLower || passenger.pessoa.nome.toLowerCase().includes(searchLower);
            const matchesTaxista = filterTaxista === "todos" || passenger.taxista?.pessoa?.nome === filterTaxista;
            const matchesComisseiro = filterComisseiro === "todos" || passenger.comisseiro?.pessoa?.nome === filterComisseiro;
            const matchesOnibus = filterOnibus === "todos" || String(passenger.onibusId) === filterOnibus;
            const city = passenger.cidadeDestino || (passenger.enderecoEntrega as any)?.cidade;
            const matchesCidade = filterCidade === "todos" || city === filterCidade;
            return matchesSearch && matchesTaxista && matchesComisseiro && matchesOnibus && matchesCidade;
        });
    }, [passengers, passengerSearchTerm, filterTaxista, filterComisseiro, filterOnibus, filterCidade]);
    
    const filteredPackages = useMemo(() => {
        return packages.filter((pkg) => {
            const searchLower = packageSearchTerm.toLowerCase();
            const matchesSearch = !searchLower || 
                (pkg.descricao && pkg.descricao.toLowerCase().includes(searchLower)) ||
                (pkg.remetente?.nome && pkg.remetente.nome.toLowerCase().includes(searchLower)) ||
                (pkg.destinatario?.nome && pkg.destinatario.nome.toLowerCase().includes(searchLower));
            const matchesTaxista = filterTaxista === "todos" || pkg.taxistaColeta?.pessoa?.nome === filterTaxista || pkg.taxistaEntrega?.pessoa?.nome === filterTaxista;
            const matchesComisseiro = filterComisseiro === "todos" || pkg.comisseiro?.pessoa?.nome === filterComisseiro;
            const cityColeta = pkg.enderecoColeta?.cidade;
            const cityEntrega = pkg.enderecoEntrega?.cidade;
            const matchesCidade = filterCidade === "todos" || cityColeta === filterCidade || cityEntrega === filterCidade;
            return matchesSearch && matchesTaxista && matchesComisseiro && matchesCidade;
        });
    }, [packages, packageSearchTerm, filterTaxista, filterComisseiro, filterCidade]);
    
    const resetFilters = () => { setFilterTaxista("todos"); setFilterComisseiro("todos"); setFilterOnibus("todos"); setFilterCidade("todos"); setPassengerSearchTerm(""); setPackageSearchTerm(""); };
    const hasPassengerFilters = filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterOnibus !== 'todos' || filterCidade !== 'todos' || passengerSearchTerm !== '';
    const hasPackageFilters = filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterCidade !== 'todos' || packageSearchTerm !== '';
    const passengerTabLabel = filteredPassengers.length === passengers.length ? `Passageiros (${passengers.length})` : `Passageiros (${filteredPassengers.length}/${passengers.length})`;
    const packageTabLabel = filteredPackages.length === packages.length ? `Encomendas (${packages.length})` : `Encomendas (${filteredPackages.length}/${packages.length})`;

    const getPassengerCsvData = () => { 
        const headers = [{ label: "Nome", key: "pessoa.nome" }, { label: "CPF", key: "pessoa.cpf" }, { label: "Telefone", key: "pessoa.telefone" }, { label: "Assento", key: "numeroAssento" }, { label: "Coleta", key: "enderecoColeta.cidade" }, { label: "Entrega", key: "enderecoEntrega.cidade" }, { label: "Valor", key: "valor" }, { label: "Status", key: "statusPagamento" }, { label: "Taxista", key: "taxista.pessoa.nome" }];
        const data = filteredPassengers.map(p => ({ ...p, statusPagamento: p.pago ? 'Pago' : 'Pendente', numeroAssento: p.numeroAssento || 'N/A' }));
        return { headers, data };
    };
    const getPackageCsvData = () => {
        const headers = [{ label: "Descrição", key: "descricao" }, { label: "Remetente", key: "remetente.nome" }, { label: "Destinatário", key: "destinatario.nome" }, { label: "Valor", key: "valor" }, { label: "Status", key: "statusPagamento" }];
        const data = filteredPackages.map(p => ({ ...p, statusPagamento: p.pago ? 'Pago' : 'Pendente' }));
        return { headers, data };
    };

    if (loading && !trip) return <div className="p-8 text-center">Carregando...</div>;
    if (!trip && !loading) return <div className="p-8 text-center">Viagem não encontrada.</div>;
    const currentBus = trip.onibus ? trip.onibus.find(b => b.id === currentBusId) : null; 

    return (
        <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/trips')} className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold tracking-tight">Detalhes da viagem</h2>
                        <p className="text-xs md:text-sm text-muted-foreground">Gerenciamento de passageiros</p>
                    </div>
                </div>
                
                {/* BOTÕES (FLEX-WRAP PARA MOBILE) */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setIsMapOpen(!isMapOpen)} className="hidden xl:flex gap-2 whitespace-nowrap">
                        {isMapOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                        {isMapOpen ? 'Ocultar Mapa' : 'Mostrar Mapa'}
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${tripId}/print`)} className="whitespace-nowrap"><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
                    <div className="flex gap-2">
                        <CSVLink data={getPassengerCsvData().data} headers={getPassengerCsvData().headers} filename={`passageiros.csv`}><Button variant="outline" size="sm" className="whitespace-nowrap"><FileDown className="w-4 h-4 mr-2" /> CSV Pax</Button></CSVLink>
                        <CSVLink data={getPackageCsvData().data} headers={getPackageCsvData().headers} filename={`encomendas.csv`}><Button variant="outline" size="sm" className="whitespace-nowrap"><FileDown className="w-4 h-4 mr-2" /> CSV Enc</Button></CSVLink>
                    </div>
                </div>
            </div>

            {/* INFO CARD */}
            <Card className="border-none shadow-sm bg-slate-50">
                <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col xl:flex-row justify-between gap-4 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 xl:flex-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <div className="flex flex-col"><span className="text-[10px] font-semibold text-foreground uppercase">Partida</span><span>{new Date(trip.dataHoraPartida).toLocaleDateString()} {new Date(trip.dataHoraPartida).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <div className="flex flex-col"><span className="text-[10px] font-semibold text-foreground uppercase">Chegada</span><span>{new Date(trip.dataHoraChegada).toLocaleDateString()} {new Date(trip.dataHoraChegada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                            </div>
                             <div className="flex items-center gap-2 text-muted-foreground col-span-2 md:col-span-1">
                                <BusIcon className="w-4 h-4" />
                                <div className="flex flex-col"><span className="text-[10px] font-semibold text-foreground uppercase">Frota</span><span>{currentBus?.placa || 'N/A'}</span></div>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 pt-2 border-t xl:border-t-0 xl:border-l xl:pl-4 border-slate-200">
                             <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded text-blue-600"><Users className="w-4 h-4" /></div>
                                <div><span className="text-xs font-medium text-muted-foreground block md:hidden">Pax</span><span className="text-xs font-medium text-muted-foreground hidden md:block">Passageiros</span><span className="text-lg font-bold leading-none">{passengers.length}</span></div>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-orange-100 rounded text-orange-600"><Package className="w-4 h-4" /></div>
                                <div><span className="text-xs font-medium text-muted-foreground block md:hidden">Enc</span><span className="text-xs font-medium text-muted-foreground hidden md:block">Encomendas</span><span className="text-lg font-bold leading-none">{packages.length}</span></div>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Mobile View Switcher */}
            <div className="md:hidden w-full bg-slate-100 p-1 rounded-lg grid grid-cols-2 gap-1 mb-2">
                <button onClick={() => setMobileView('list')} className={cn("py-2 text-sm font-medium rounded-md transition-all", mobileView === 'list' ? "bg-white shadow text-primary" : "text-slate-500")}><div className="flex items-center justify-center gap-2"><ListIcon className="w-4 h-4"/> Lista</div></button>
                <button onClick={() => setMobileView('map')} className={cn("py-2 text-sm font-medium rounded-md transition-all", mobileView === 'map' ? "bg-white shadow text-primary" : "text-slate-500")}><div className="flex items-center justify-center gap-2"><MapIcon className="w-4 h-4"/> Mapa</div></button>
            </div>

            {/* === GRID PRINCIPAL === */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* --- COLUNA ESQUERDA (TABELA) --- */}
                <div className={cn(
                    "transition-all duration-500 ease-in-out",
                    isMapOpen ? "xl:col-span-9" : "xl:col-span-12", 
                    mobileView === 'map' ? "hidden xl:block" : "block"
                )}>
                    <Tabs defaultValue="passengers" className="space-y-4">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="passengers">{passengerTabLabel}</TabsTrigger>
                            <TabsTrigger value="packages">{packageTabLabel}</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="passengers" className="space-y-4">
                            <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm space-y-3">
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <div className="relative flex-1"><Input placeholder="Pesquisar nome..." value={passengerSearchTerm} onChange={(e) => setPassengerSearchTerm(e.target.value)} /></div>
                                    <div className="flex items-center gap-2 justify-between lg:justify-start">
                                        {hasPassengerFilters && (<Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-500 h-9"><X className="w-4 h-4 mr-1" /> Limpar</Button>)}
                                        <Button onClick={() => { setSelectedPassenger(null); setIsPassengerModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2 w-full lg:w-auto"><Plus className="w-4 h-4" /> Novo</Button>
                                    </div>
                                </div>
                                {/* Filtros... */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <Select value={filterTaxista} onValueChange={setFilterTaxista}><SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="Taxista" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos Taxistas</SelectItem>{uniqueTaxistas.map((t:any)=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                    <Select value={filterComisseiro} onValueChange={setFilterComisseiro}><SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="Comisseiro" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos Comisseiros</SelectItem>{uniqueComisseiros.map((c:any)=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                    <Select value={filterOnibus} onValueChange={setFilterOnibus}><SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="Ônibus" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos Ônibus</SelectItem>{uniqueOnibusIds.map((id:any)=>{const bus=busMap.get(id);return <SelectItem key={id} value={String(id)}>{bus?bus.placa:`ID ${id}`}</SelectItem>;})}</SelectContent></Select>
                                    <Select value={filterCidade} onValueChange={setFilterCidade}><SelectTrigger className="bg-background text-xs h-9"><SelectValue placeholder="Cidade" /></SelectTrigger><SelectContent><SelectItem value="todos">Todas Cidades</SelectItem>{uniqueCidades.map((c:any)=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                            <PassengerTable 
                                passengers={filteredPassengers} loading={loading} busMap={busMap} 
                                onMarkAsPaid={(id) => handleMarkAsPaid('passenger', id)} 
                                onOpenLuggage={(p) => { setSelectedPassenger(p); setIsLuggageModalOpen(true); }} 
                                onEdit={(p) => { setSelectedPassenger(p); setIsPassengerModalOpen(true); }} 
                                onDelete={(p) => setDeleteItem({ type: 'passenger', item: p })} 
                                onRefreshData={fetchFilteredData} 
                            />
                        </TabsContent>
                        
                        <TabsContent value="packages" className="space-y-4">
                             <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm space-y-3">
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <div className="relative flex-1"><Input placeholder="Pesquisar..." value={packageSearchTerm} onChange={(e) => setPackageSearchTerm(e.target.value)} /></div>
                                    <div className="flex items-center gap-2 justify-between lg:justify-start">
                                        {hasPackageFilters && (<Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-500 h-9"><X className="w-4 h-4 mr-1" /> Limpar</Button>)}
                                        <Button onClick={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2 w-full lg:w-auto"><Plus className="w-4 h-4" /> Nova</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <Select value={filterTaxista} onValueChange={setFilterTaxista}><SelectTrigger className="bg-background text-xs h-8"><SelectValue placeholder="Taxista" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos Taxistas</SelectItem>{uniqueTaxistas.map((t:any)=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                                    <Select value={filterComisseiro} onValueChange={setFilterComisseiro}><SelectTrigger className="bg-background text-xs h-8"><SelectValue placeholder="Comisseiro" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos Comisseiros</SelectItem>{uniqueComisseiros.map((c:any)=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                    <Select value={filterCidade} onValueChange={setFilterCidade}><SelectTrigger className="bg-background text-xs h-8"><SelectValue placeholder="Cidade" /></SelectTrigger><SelectContent><SelectItem value="todos">Todas Cidades</SelectItem>{uniqueCidades.map((c:any)=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </div>
                            <PackageTable packages={filteredPackages} loading={loading} onMarkAsPaid={(id) => handleMarkAsPaid('package', id)} onEdit={(p) => { setSelectedPackage(p); setIsPackageModalOpen(true); }} onDelete={(p) => setDeleteItem({ type: 'package', item: p })} onRefreshData={fetchFilteredData} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* --- ÁREA DA DIREITA (MAPA) --- */}
                <div className={cn(
                    "xl:col-span-3 transition-all duration-500",
                    mobileView === 'map' ? "block" : "hidden", // Mobile Logic
                    isMapOpen ? "xl:block" : "xl:hidden" // Desktop Logic
                )}>
                    <div className="sticky top-6 space-y-4">
                        {trip?.onibus && trip.onibus.length > 1 ? (
                            <Tabs defaultValue={currentBusId?.toString()} onValueChange={(val) => setCurrentBusId(parseInt(val))} className="w-full">
                                <TabsList className="w-full mb-2 grid grid-cols-2">
                                    {trip.onibus.map(bus => (
                                        <TabsTrigger key={bus.id} value={bus.id.toString()} className="text-xs px-1 truncate">{bus.placa}</TabsTrigger>
                                    ))}
                                </TabsList>
                                {trip.onibus.map(bus => (
                                    <TabsContent key={bus.id} value={bus.id.toString()} className="mt-0">
                                        <SeatMap tripId={tripIdNum} busId={bus.id} layoutJson={bus.layoutJson} capacity={bus.capacidadePassageiros} onSelectSeat={handleSelectSeat} passengers={passengers.filter(p => p.onibusId === bus.id)} />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : (
                            <SeatMap tripId={tripIdNum} busId={currentBusId || 0} layoutJson={currentBus?.layoutJson} capacity={currentBus?.capacidadePassageiros || 0} onSelectSeat={handleSelectSeat} passengers={passengers.filter(p => p.onibusId === (currentBusId || 0))} />
                        )}
                    </div>
                </div>

            </div>

            {/* Modais */}
            <PassengerModal isOpen={isPassengerModalOpen} onClose={() => { setIsPassengerModalOpen(false); setSelectedPassenger(null); }} onSave={handleSavePassenger} passenger={selectedPassenger} />
            <PackageModal isOpen={isPackageModalOpen} onClose={() => { setIsPackageModalOpen(false); setSelectedPackage(null); }} onSave={handleSavePackage} package={selectedPackage} />
            <LuggageModal isOpen={isLuggageModalOpen} onClose={() => { setIsLuggageModalOpen(false); setSelectedPassenger(null); fetchFilteredData(); }} passenger={selectedPassenger} />
            <SeatBinderModal isOpen={isSeatBinderModalOpen} onClose={() => { setIsSeatBinderModalOpen(false); setSeatTargetId(null); }} onBind={handleBindPassenger} availablePassengers={availablePassengers} seatId={seatTargetId} seatNumber={seatTargetNumber} />
            <DeleteConfirmModal isOpen={!!passengerToDesassociate} onClose={() => { setPassengerToDesassociate(null); }} onConfirm={handleDesassociateConfirm} title="Desvincular Assento" description={`Tem certeza de que deseja desvincular o assento?`} />
            <DeleteConfirmModal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDeleteConfirm} title="Excluir Item" description="Tem certeza?" />
        </div>
    );
}