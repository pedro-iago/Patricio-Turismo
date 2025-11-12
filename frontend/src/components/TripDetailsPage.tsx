import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Briefcase, Search, 
  Printer, 
  FileDown, 
  DollarSign 
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
import { Skeleton } from './ui/skeleton';
import { CSVLink } from 'react-csv'; 

import PassengerTable from './PassengerTable';
import PackageTable from './PackageTable';
import SeatMap from './SeatMap'; 
import SeatBinderModal from './SeatBinderModal';


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
  onibusId: number; 
}
interface Page<T> { content: T[]; } 

interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

interface PassengerSaveDto {
  pessoaId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  taxistaId?: number;
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
  assentoId?: number | null;
}
interface PackageSaveDto {
  descricao: string;
  remetenteId: number;
  destinatarioId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  taxistaId?: number;
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

interface PassengerData { 
    id: number;
    pessoa: { id: number; nome: string; cpf: string; }; 
    enderecoColeta: { id: number }; 
    enderecoEntrega: { id: number }; 
    valor?: number;
    metodoPagamento?: string;
    pago?: boolean;
    taxista?: Affiliate;
    comisseiro?: Affiliate;
    assentoId: number | null; 
    numeroAssento?: string; 
    luggageCount?: number;
    [key: string]: any; 
}
interface PackageData { 
    id: number;
    descricao: string;
    remetente: { id: number, nome: string };
    destinatario: { id: number, nome: string };
    valor?: number; 
    pago?: boolean; 
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
    
    // --- ESTADOS PARA ASSENTOS/VINCULAÇÃO ---
    const [isSeatBinderModalOpen, setIsSeatBinderModalOpen] = useState(false);
    const [seatTargetId, setSeatTargetId] = useState<number | null>(null); 
    const [seatTargetNumber, setSeatTargetNumber] = useState('');
    const [passengerToDesassociate, setPassengerToDesassociate] = useState<PassengerData | null>(null); 
    const [availablePassengers, setAvailablePassengers] = useState<PassengerData[]>([]); 
    const [seatMapRefreshKey, setSeatMapRefreshKey] = useState(0);

    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState<PassengerData | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
    const [deleteItem, setDeleteItem] = useState<{ type: 'passenger' | 'package'; item: any } | null>(null);
    const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
    const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
    const [filterTaxistaId, setFilterTaxistaId] = useState<string>('all');
    const [filterComisseiroId, setFilterComisseiroId] = useState<string>('all');
    const [passengerSearchTerm, setPassengerSearchTerm] = useState('');
    const [packageSearchTerm, setPackageSearchTerm] = useState('');
    
    // --- Funções de Busca (Busca inicial de dados) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!tripIdNum || isNaN(tripIdNum)) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                const [tripResponse, taxistasRes, comisseirosRes, busesRes] = await Promise.all([
                    api.get<TripDto>(`/api/viagem/${tripIdNum}`), 
                    api.get<Page<Affiliate>>('/api/v1/affiliates/taxistas'), 
                    api.get<Page<Affiliate>>('/api/v1/affiliates/comisseiros'),
                    api.get<Bus[]>('/api/onibus') 
                ]);
                
                setTrip(tripResponse.data);
                setTaxistas(taxistasRes.data.content); 
                setComisseiros(comisseirosRes.data.content); 

                const newBusMap = new Map<number, Bus>();
                busesRes.data.forEach(bus => { 
                  newBusMap.set(bus.id, bus); 
                });
                setBusMap(newBusMap);

            } catch (error) { 
                 console.error('Erro ao buscar detalhes da viagem ou afiliados:', error);
                 setTrip(null); 
            }
            finally { setLoading(false); }
        };
        fetchInitialData();
    }, [tripIdNum]);


    // --- Funções de Busca (Recarga de passageiros e encomendas) ---
    const fetchFilteredData = useCallback(async () => {
        if (!tripIdNum || isNaN(tripIdNum)) {
            return;
        }
        
        let passengerUrl = `/api/v1/reports/passageiros/viagem/${tripIdNum}`; 
        let packageUrl = `/api/v1/reports/encomendas/viagem/${tripIdNum}`; 
        
        try {
            setLoading(true); 
            const [passengersResponse, packagesResponse] = await Promise.all([
                api.get<PassengerData[]>(passengerUrl), 
                api.get<PackageData[]>(packageUrl)     
            ]);
            
            const passengersData: PassengerData[] = passengersResponse.data;
            
            const passengersWithLuggage = await Promise.all( 
                passengersData.map(async (passenger) => { 
                    const luggageResponse = await api.get(`/api/bagagem/passageiro/${passenger.id}`);
                    return { 
                        ...passenger, 
                        luggageCount: luggageResponse.data.length,
                    };
                })
            );
            
            setPassengers(passengersWithLuggage);
            setPackages(packagesResponse.data); 
            setAvailablePassengers(passengersWithLuggage.filter(p => !p.numeroAssento));
            
        } catch (error) { 
            console.error('Erro ao buscar dados filtrados:', error);
        }
        finally { setLoading(false); }
    }, [tripIdNum]);
    
    useEffect(() => { fetchFilteredData(); }, [fetchFilteredData]);


    // --- FUNÇÕES DO CRUD DE ASSENTOS ---
    
    const handleSelectSeat = (seatId: number, seatNumber: string, isOccupied: boolean) => {
        setSeatTargetId(seatId);
        setSeatTargetNumber(seatNumber);

        if (isOccupied) {
            const passenger = passengers.find(p => p.numeroAssento === seatNumber); 
            if (passenger) {
                setPassengerToDesassociate(passenger);
            } else {
                console.warn(`Assento ${seatNumber} ocupado, mas passageiro não encontrado na lista.`); 
                fetchFilteredData();
            }
        } else {
            setIsSeatBinderModalOpen(true);
        }
    };
    
    const updatePassengerAssento = async (passengerId: number, newSeatId: number | null) => {
        const passenger = passengers.find(p => p.id === passengerId);
        if (!passenger) { alert("Erro: Passageiro não encontrado para vincular."); return; }
        
        const updateDto = { 
            pessoaId: passenger.pessoa.id,
            enderecoColetaId: passenger.enderecoColeta.id,
            enderecoEntregaId: passenger.enderecoEntrega.id,
            viagemId: tripIdNum,
            valor: passenger.valor,
            metodoPagamento: passenger.metodoPagamento,
            pago: passenger.pago,
            taxistaId: passenger.taxista?.id,
            comisseiroId: passenger.comisseiro?.id,
            assentoId: newSeatId,
        };

        try {
            await api.put(`/api/passageiroviagem/${passengerId}`, updateDto);
            
            setIsSeatBinderModalOpen(false);
            setPassengerToDesassociate(null);
            setSeatTargetId(null);
            
            fetchFilteredData(); 
            setSeatMapRefreshKey(prevKey => prevKey + 1);

        } catch (error) {
            console.error("Erro ao processar assento:", error);
            alert("Erro ao vincular ou desvincular assento.");
        }
    }
    
    const handleBindPassenger = (passengerId: number, seatId: number) => {
        updatePassengerAssento(passengerId, seatId);
    };

    const handleDesassociateConfirm = () => {
        if (passengerToDesassociate) {
            updatePassengerAssento(passengerToDesassociate.id, null);
        }
    };
    
    // --- ✅ Handlers de CRUD (Passageiro/Encomenda) RESTAURADOS ---
    
    const handleSavePassenger = async (passengerDto: PassengerSaveDto) => {
        if (!tripIdNum) return alert("ID da Viagem inválido.");
        
        const fullDto = { 
            ...passengerDto, 
            viagemId: tripIdNum 
        };
        try {
          if (selectedPassenger) {
            await api.put(`/api/passageiroviagem/${selectedPassenger.id}`, fullDto); 
          } else {
            await api.post('/api/passageiroviagem', fullDto); 
          }
          setIsPassengerModalOpen(false);
          setSelectedPassenger(null);
          await fetchFilteredData(); 
        } catch (error) { console.error("Erro ao salvar passageiro:", error); }
    };
    
    const handleSavePackage = async (packageDto: PackageSaveDto) => {
        if (!tripIdNum) return alert("ID da Viagem inválido.");
        const fullDto = { ...packageDto, viagemId: tripIdNum };
        try {
          if (selectedPackage) {
            await api.put(`/api/encomenda/${selectedPackage.id}`, fullDto);
          } else {
            await api.post('/api/encomenda', fullDto);
          }
          setIsPackageModalOpen(false);
          setSelectedPackage(null);
          await fetchFilteredData(); 
        } catch (error) { console.error("Erro ao salvar encomenda:", error); }
    };

    const handleEditPassenger = (passenger: PassengerData) => {
        setSelectedPassenger(passenger);
        setIsPassengerModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;
        try {
            if (deleteItem.type === 'passenger') {
                await api.delete(`/api/passageiroviagem/${deleteItem.item.id}`); 
            } else if (deleteItem.type === 'package') {
                await api.delete(`/api/encomenda/${deleteItem.item.id}`);
            }
            setDeleteItem(null);
            await fetchFilteredData(); 
        } catch (error) { console.error("Erro ao deletar item:", error); }
    };

    const handleMarkAsPaid = async (type: 'passenger' | 'package', id: number) => {
        const url = type === 'passenger' ? `/api/passageiroviagem/${id}/marcar-pago` : `/api/encomenda/${id}/marcar-pago`;
        try {
          await api.patch(url);
          await fetchFilteredData(); 
        } catch (error) { console.error(`Erro ao marcar ${type} como pago:`, error); }
    };
      
    const openLuggageModal = (passenger: PassengerData) => { 
      setSelectedPassenger(passenger); 
      setIsLuggageModalOpen(true); 
    };
    
    const handleSaveLuggage = () => { 
      setIsLuggageModalOpen(false); 
      setSelectedPassenger(null); 
      fetchFilteredData(); 
    };

    // --- ✅ Filtros (Frontend) RESTAURADOS ---
    const filteredPassengers = passengers.filter((passenger) => {
        const searchLower = passengerSearchTerm.toLowerCase();
        if (!searchLower) return true; 
        return passenger.pessoa.nome.toLowerCase().includes(searchLower);
    });
    
    const filteredPackages = packages.filter((pkg) => {
        const searchLower = packageSearchTerm.toLowerCase();
        if (!searchLower) return true;
        const descMatch = pkg.descricao && pkg.descricao.toLowerCase().includes(searchLower);
        return descMatch; 
    });
    
    const getPassengerCsvData = () => { return []; };
    const getPackageCsvData = () => { return []; };


    if (loading && !trip) { 
        return (
             <div className="space-y-6 p-4">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
     }

    if (!trip && !loading) { 
        return (
            <div className="text-center p-8">
                <h2>Viagem não encontrada</h2>
                <p>O ID da viagem pode ser inválido ou não existir.</p>
                <Button onClick={() => navigate('/trips')} className="mt-4">
                    Voltar para Viagens
                </Button>
            </div>
        );
    }
    
    const currentBus = trip ? busMap.get(trip.onibusId) : null; 

    // --- LÓGICA DO CARD FINANCEIRO ---
    const formatBRL = (value: number | undefined) => {
      if (value === undefined || value === null) return 'R$ 0,00';
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const arrecadadoPassageiros = passengers
      .filter(p => p.pago && p.valor)
      .reduce((acc, p) => acc + p.valor!, 0);
    const pendentePassageiros = passengers
      .filter(p => !p.pago && p.valor)
      .reduce((acc, p) => acc + p.valor!, 0);

    const arrecadadoEncomendas = packages
      .filter(p => p.pago && p.valor)
      .reduce((acc, p) => acc + p.valor!, 0);
    const pendenteEncomendas = packages
      .filter(p => !p.pago && p.valor)
      .reduce((acc, p) => acc + p.valor!, 0);

    const totalArrecadado = arrecadadoPassageiros + arrecadadoEncomendas;
    const totalPendente = pendentePassageiros + pendenteEncomendas;
    // --- FIM DOS CÁLCULOS ---

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/trips')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2>Detalhes da viagem</h2>
                    <p className="text-muted-foreground mt-1">Bahia ↔ São Paulo</p>
                </div>
            </div>

            {/* --- BLOCO 1: INFO E MAPA (COM LAYOUT CORRIGIDO) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* COLUNA 1: Cards de Informação e Resumo */}
                <div className="flex flex-col space-y-6">
                
                    {/* Card de Informações (Já existe) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações de viagem</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div><p className="text-sm text-muted-foreground">Data</p><p>{trip ? new Date(trip.dataHoraPartida).toLocaleDateString() : 'N/A'}</p></div>
                                <div><p className="text-sm text-muted-foreground">Partida</p><p>{trip ? new Date(trip.dataHoraPartida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p></div>
                                <div><p className="text-sm text-muted-foreground">Chegada</p><p>{trip ? new Date(trip.dataHoraChegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p></div>
                                
                                <div><p className="text-sm text-muted-foreground">Ônibus</p><p>{currentBus?.placa || 'N/A'}</p></div>
                                <div><p className="text-sm text-muted-foreground">Modelo</p><p>{currentBus?.modelo || 'N/A'}</p></div>
                                <div><p className="text-sm text-muted-foreground">Capacidade</p><p>{currentBus?.capacidadePassageiros || 'N/A'}</p></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ✅ Card de Resumo (Contagem) RESTAURADO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo da Viagem</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total de Passageiros</p>
                                    <p className="text-2xl font-bold">{passengers.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total de Encomendas</p>
                                    <p className="text-2xl font-bold">{packages.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ✅ Card de Resumo Financeiro (Simplificado) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo Financeiro</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Arrecadado (Pago)</p>
                                <p className="text-2xl font-bold text-green-600">{formatBRL(totalArrecadado)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pendente (A Receber)</p>
                                <p className="text-2xl font-bold text-yellow-600">{formatBRL(totalPendente)}</p>
                            </div>
                        </CardContent>
                    </Card>

                </div> {/* Fim da Coluna 1 */}


                {/* COLUNA 2: Mapa de Assentos (Já existe) */}
                <SeatMap
                    tripId={tripIdNum} 
                    onSelectSeat={handleSelectSeat}
                    onRefresh={fetchFilteredData}
                    refreshKey={seatMapRefreshKey}
                />

            </div>
            {/* --- FIM DO BLOCO 1 --- */}


            {/* --- BLOCO 3: ABAS E TABELAS --- */}
            <div className="space-y-6">
                <Tabs defaultValue="passengers" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="passengers">Passageiros ({passengers.length})</TabsTrigger>
                        <TabsTrigger value="packages">Encomendas ({packages.length})</TabsTrigger>
                    </TabsList>
                    
                    {/* Conteúdo da Aba Passageiros */}
                    <TabsContent value="passengers" className="space-y-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Filtros */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Select value={filterTaxistaId} onValueChange={(val) => { setFilterTaxistaId(val); setFilterComisseiroId('all'); }}>
                                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Taxista" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Taxistas</SelectItem>
                                        {taxistas.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.pessoa.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterComisseiroId} onValueChange={(val) => { setFilterComisseiroId(val); setFilterTaxistaId('all'); }}>
                                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Comisseiro" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Comisseiros</SelectItem>
                                        {comisseiros.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.pessoa.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Ações */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input type="text" placeholder="Pesquisar na lista..." value={passengerSearchTerm} onChange={(e) => setPassengerSearchTerm(e.target.value)} className="pl-10" />
                                </div>
                                <CSVLink data={getPassengerCsvData()} filename={`passageiros_viagem_${tripId}.csv`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    <FileDown className="w-4 h-4" />
                                </CSVLink>
                                <Button variant="outline" size="icon" onClick={() => navigate(`/trips/${tripId}/print`)}>
                                    <Printer className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => { setSelectedPassenger(null); setIsPassengerModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2">
                                    <Plus className="w-4 h-4" />
                                    Passageiro
                                </Button>
                            </div>
                        </div>
                        <PassengerTable
                            passengers={filteredPassengers}
                            loading={loading}
                            onMarkAsPaid={(id) => handleMarkAsPaid('passenger', id)}
                            onOpenLuggage={openLuggageModal}
                            onEdit={handleEditPassenger}
                            onDelete={(p) => setDeleteItem({ type: 'passenger', item: p })}
                        />
                    </TabsContent>
                    
                    {/* Conteúdo da Aba Encomendas */}
                    <TabsContent value="packages" className="space-y-4">
                       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Filtros */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <Select value={filterTaxistaId} onValueChange={(val) => { setFilterTaxistaId(val); setFilterComisseiroId('all'); }}>
                                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Taxista" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Taxistas</SelectItem>
                                        {taxistas.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.pessoa.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterComisseiroId} onValueChange={(val) => { setFilterComisseiroId(val); setFilterTaxistaId('all'); }}>
                                    <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Comisseiro" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Comisseiros</SelectItem>
                                        {comisseiros.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.pessoa.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Ações */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input type="text" placeholder="Pesquisar na lista..." value={packageSearchTerm} onChange={(e) => setPackageSearchTerm(e.target.value)} className="pl-10" />
                                </div>
                                <CSVLink data={getPackageCsvData()} filename={`encomendas_viagem_${tripId}.csv`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    <FileDown className="w-4 h-4" />
                                </CSVLink>
                                <Button onClick={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2">
                                    <Plus className="w-4 h-4" />
                                    Encomenda
                                </Button>
                            </div>
                        </div>
                        <PackageTable
                            packages={filteredPackages}
                            loading={loading}
                            onMarkAsPaid={(id) => handleMarkAsPaid('package', id)}
                            onEdit={(pkg) => { setSelectedPackage(pkg); setIsPackageModalOpen(true); }}
                            onDelete={(pkg) => setDeleteItem({ type: 'package', item: pkg })}
                        />
                    </TabsContent>
                </Tabs>
            </div>


            {/* --- Modais --- */}
            <PassengerModal
                isOpen={isPassengerModalOpen}
                onClose={() => { setIsPassengerModalOpen(false); setSelectedPassenger(null); }}
                onSave={handleSavePassenger}
                passenger={selectedPassenger}
            />
            
             <PackageModal
                isOpen={isPackageModalOpen}
                onClose={() => {
                  setIsPackageModalOpen(false);
                  setSelectedPackage(null);
                }}
                onSave={handleSavePackage}
                package={selectedPackage}
            />

            <LuggageModal
                isOpen={isLuggageModalOpen}
                onClose={handleSaveLuggage}
                passenger={selectedPassenger}
            />
            
            <SeatBinderModal
                isOpen={isSeatBinderModalOpen}
                onClose={() => { setIsSeatBinderModalOpen(false); setSeatTargetId(null); }}
                onBind={handleBindPassenger}
                availablePassengers={availablePassengers}
                seatId={seatTargetId}
                seatNumber={seatTargetNumber}
            />

            <DeleteConfirmModal
                isOpen={!!passengerToDesassociate}
                onClose={() => { setPassengerToDesassociate(null); }}
                onConfirm={handleDesassociateConfirm}
                title="Desvincular Assento"
                description={`Tem certeza de que deseja desvincular o assento ${passengerToDesassociate?.numeroAssento || seatTargetNumber} de ${passengerToDesassociate?.pessoa?.nome}?`}
            />

            <DeleteConfirmModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteConfirm}
                title={`Excluir ${deleteItem?.type === 'passenger' ? 'Passageiro' : 'Encomenda'}`}
                description={`Tem certeza de que deseja excluir? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
}