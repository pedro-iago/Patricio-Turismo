import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Calendar, MapPin, Bus, Users, Search, Filter, 
  ArrowRight, Clock, AlertCircle, ChevronRight, X, Edit, Trash2, Settings, Package
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format, isBefore, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { toast } from 'sonner';

// Import dos Modais
import QuickTicketModal from './QuickTicketModal';
import FamilyPassengerModal from './FamilyPassengerModal';
import TripModal from './TripModal';
import DeleteConfirmModal from './DeleteConfirmModal';

// Interfaces
interface BusData { id: number; placa: string; modelo: string; capacidadePassageiros?: number; }
interface Trip { 
    id: number; 
    dataHoraPartida: string; 
    dataHoraChegada: string; 
    onibusId?: number;
    onibus?: BusData[];
    listaOnibus?: BusData[]; 
    totalPassageiros?: number;
    totalEncomendas?: number;
}

export default function TripsPage() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>('all');

    // Estados dos Modais
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
    
    const [familyModalState, setFamilyModalState] = useState<{ isOpen: boolean; tripId: string | null }>({
        isOpen: false,
        tripId: null
    });

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 1) + i);
    const months = [
        { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
        { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
        { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
        { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
        { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
    ];

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('sort', 'dataHoraPartida,desc');
            params.append('size', '100');
            
            if (selectedMonth !== 'all') params.append('mes', selectedMonth);
            if (selectedYear !== 'all') params.append('ano', selectedYear);

            const response = await api.get(`/api/viagem?${params.toString()}`);
            let tripsData = response.data.content || response.data;
            
            const busesRes = await api.get('/api/onibus');
            const buses = busesRes.data;
            const busMap = new Map(buses.map((b: BusData) => [b.id, b]));

            const enrichedTrips = tripsData.map((t: any) => {
                let busList: BusData[] = [];
                if (t.listaOnibus && t.listaOnibus.length > 0) {
                    busList = t.listaOnibus;
                } else if (Array.isArray(t.onibus)) {
                    busList = t.onibus;
                } else if (t.onibusId) {
                    const b = busMap.get(t.onibusId);
                    if (b) busList = [b];
                }
                return { ...t, onibus: busList };
            });

            setTrips(enrichedTrips);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar viagens.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTrips(); }, [selectedMonth, selectedYear]);

    const { upcoming, past } = useMemo(() => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 12); 

        const filtered = trips.filter(trip => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const dateStr = format(parseISO(trip.dataHoraPartida), "dd/MM/yyyy");
            const buses = trip.onibus?.map(b => b.placa).join(' ') || '';
            return dateStr.includes(term) || buses.toLowerCase().includes(term);
        });

        const upcomingList: Trip[] = [];
        const pastList: Trip[] = [];

        filtered.forEach(trip => {
            const tripDate = parseISO(trip.dataHoraPartida);
            if (isAfter(tripDate, cutoff)) upcomingList.push(trip);
            else pastList.push(trip);
        });
        
        upcomingList.sort((a,b) => new Date(a.dataHoraPartida).getTime() - new Date(b.dataHoraPartida).getTime());
        pastList.sort((a,b) => new Date(b.dataHoraPartida).getTime() - new Date(a.dataHoraPartida).getTime());

        return { upcoming: upcomingList, past: pastList };
    }, [trips, searchTerm]);

    const handleSaveTrip = async (data: any) => {
        try {
            if (selectedTrip) {
                await api.put(`/api/viagem/${selectedTrip.id}`, data);
                toast.success("Viagem atualizada!");
            } else {
                await api.post('/api/viagem', data);
                toast.success("Viagem criada!");
            }
            setIsTripModalOpen(false);
            fetchTrips();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar viagem.");
        }
    };

    const handleDeleteTrip = async () => {
        if (!tripToDelete) return;
        try {
            await api.delete(`/api/viagem/${tripToDelete.id}`);
            toast.success("Viagem excluída.");
            setTripToDelete(null);
            fetchTrips();
        } catch (error) {
            toast.error("Erro ao excluir viagem.");
        }
    };

    const handleOpenFamilyFlow = (tripId: number) => {
        setIsQuickModalOpen(false);
        setFamilyModalState({ isOpen: true, tripId: String(tripId) });
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen pb-20">
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel de Viagens</h1>
                    <p className="text-sm text-slate-500">Gerencie saídas, chegadas e vendas.</p>
                </div>
                
                <div className="flex flex-col md:flex-row flex-wrap xl:flex-nowrap gap-3 w-full xl:w-auto items-center">
                    
                    {/* Filtros de Data: Lado a lado no mobile (grid-cols-2) */}
                    <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full md:w-[130px] h-10"><SelectValue placeholder="Mês" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">Todos</SelectItem>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-full md:w-[100px] h-10"><SelectValue placeholder="Ano" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">Todos</SelectItem>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    {/* Busca */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input placeholder="Buscar data ou placa..." className="pl-9 h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    
                    {/* CORREÇÃO DE LAYOUT MOBILE: 
                      Botões agora ficam empilhados em telas pequenas (flex-col) 
                      e lado a lado em telas médias/grandes (sm:flex-row)
                    */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <Button variant="outline" onClick={() => { setSelectedTrip(null); setIsTripModalOpen(true); }} className="h-10 border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> Nova Viagem
                        </Button>
                        <Button onClick={() => setIsQuickModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white shadow-md h-10 px-6 font-bold w-full sm:w-auto">
                            <Plus className="mr-2 h-5 w-5" /> VENDA RÁPIDA
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1.5 bg-yellow-400 rounded-full"></div>
                    <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Próximas Viagens</h2>
                    <span className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                </div>

                {upcoming.length === 0 && !loading && (
                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center bg-white">
                        <p className="text-slate-500 mb-2">Nenhuma viagem encontrada para este filtro.</p>
                        <Button variant="link" onClick={() => setIsQuickModalOpen(true)} className="text-orange-500">Usar Venda Rápida para criar</Button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {upcoming.map((trip, index) => (
                        <TripCard 
                            key={trip.id} trip={trip} variant={index === 0 ? 'highlight' : 'upcoming'}
                            onClick={() => navigate(`/trips/${trip.id}`)}
                            onEdit={() => { setSelectedTrip(trip); setIsTripModalOpen(true); }}
                            onDelete={() => setTripToDelete(trip)}
                        />
                    ))}
                </div>
            </div>

            {past.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-1.5 bg-slate-400 rounded-full"></div>
                        <h2 className="text-lg font-bold text-slate-600 uppercase tracking-wide">Viagens Passadas</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 opacity-90">
                        {past.map(trip => (
                            <TripCard 
                                key={trip.id} trip={trip} variant="past"
                                onClick={() => navigate(`/trips/${trip.id}`)}
                                onEdit={() => { setSelectedTrip(trip); setIsTripModalOpen(true); }}
                                onDelete={() => setTripToDelete(trip)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <QuickTicketModal isOpen={isQuickModalOpen} onClose={() => setIsQuickModalOpen(false)} onSuccess={() => fetchTrips()} onOpenFamilyFlow={handleOpenFamilyFlow} />
            {familyModalState.tripId && (<FamilyPassengerModal isOpen={familyModalState.isOpen} onClose={() => setFamilyModalState({ isOpen: false, tripId: null })} onSaveSuccess={() => { fetchTrips(); setFamilyModalState({ isOpen: false, tripId: null }); }} tripId={familyModalState.tripId} />)}
            <TripModal isOpen={isTripModalOpen} onClose={() => { setIsTripModalOpen(false); setSelectedTrip(null); }} onSave={handleSaveTrip} trip={selectedTrip} />
            <DeleteConfirmModal isOpen={!!tripToDelete} onClose={() => setTripToDelete(null)} onConfirm={handleDeleteTrip} title="Excluir Viagem" description={`Tem certeza que deseja excluir a viagem do dia ${tripToDelete ? new Date(tripToDelete.dataHoraPartida).toLocaleDateString() : ''}?`} />
        </div>
    );
}

// --- COMPONENTE TRIP CARD OTIMIZADO ---
function TripCard({ 
    trip, variant, onClick, onEdit, onDelete 
}: { 
    trip: Trip, 
    variant: 'highlight' | 'upcoming' | 'past', 
    onClick: () => void,
    onEdit: () => void,
    onDelete: () => void
}) {
    const date = parseISO(trip.dataHoraPartida);
    const day = format(date, 'dd');
    const month = format(date, 'MMM', { locale: ptBR }).toUpperCase();
    const weekDay = format(date, 'EEEE', { locale: ptBR });
    const time = format(date, 'HH:mm');

    let containerClass = "";
    let dateBoxClass = "";
    let accentColor = "";

    if (variant === 'highlight') {
        containerClass = "bg-orange-50 border-orange-200 ring-1 ring-orange-100 shadow-md";
        dateBoxClass = "bg-orange-500 text-white";
        accentColor = "text-orange-700";
    } else if (variant === 'upcoming') {
        containerClass = "bg-yellow-50/50 border-yellow-200 hover:shadow-md hover:border-yellow-300";
        dateBoxClass = "bg-yellow-400 text-yellow-900";
        accentColor = "text-yellow-700";
    } else { 
        containerClass = "bg-white border-slate-200 hover:border-slate-300";
        dateBoxClass = "bg-slate-200 text-slate-600";
        accentColor = "text-slate-500";
    }

    const busList = trip.onibus && trip.onibus.length > 0 ? trip.onibus : [];
    
    // Contadores
    const paxCount = trip.totalPassageiros !== undefined ? trip.totalPassageiros : '?';
    const pkgCount = trip.totalEncomendas !== undefined ? trip.totalEncomendas : '?';

    return (
        <div onClick={onClick} className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col gap-3 group ${containerClass}`}>
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex flex-col items-center justify-center w-12 h-14 rounded-lg shadow-sm shrink-0 ${dateBoxClass}`}>
                        <span className="text-[10px] font-bold uppercase leading-none mt-1">{month}</span>
                        <span className="text-2xl font-black leading-none">{day}</span>
                    </div>
                    <div className="min-w-0">
                        <div className={`text-sm font-bold uppercase truncate ${accentColor}`}>{weekDay}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Clock className="w-3 h-3 shrink-0" /> {time}
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
            </div>

            {/* Rota */}
            <div className="relative h-px bg-slate-200 w-full my-1">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider border border-slate-100 rounded-full whitespace-nowrap">
                    Bahia <span className="mx-1">↔</span> SP
                </div>
            </div>

            {/* Infos: Veículos e Ocupação */}
            <div className="grid grid-cols-2 gap-2 pt-1">
                
                {/* 1. Lista de Placas dos Ônibus */}
                <div className="flex flex-col gap-1 bg-white/60 p-2 rounded border border-black/5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Bus className="w-3 h-3" /> Veículo(s)
                    </div>
                    {/* Adicionado flex-wrap para não estourar se tiver muitos ônibus */}
                    <div className="flex flex-wrap gap-1">
                        {busList.length > 0 ? (
                            busList.map(b => (
                                <div key={b.id} className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit border border-slate-200 truncate max-w-full">
                                    {b.placa}
                                </div>
                            ))
                        ) : (
                            <span className="text-[10px] text-slate-400 italic">A definir</span>
                        )}
                    </div>
                </div>

                {/* 2. Totais (Pax e Encomendas) */}
                <div className="flex flex-col gap-1 bg-white/60 p-2 rounded border border-black/5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Users className="w-3 h-3" /> Ocupação
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex flex-col">
                            <span className={`text-lg font-black leading-none ${variant === 'highlight' ? 'text-orange-600' : 'text-slate-700'}`}>
                                {paxCount}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">Pax</span>
                        </div>
                        <div className="w-px h-6 bg-slate-200"></div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black leading-none text-slate-700">
                                {pkgCount}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">Encom.</span>
                        </div>
                    </div>
                </div>
            </div>

            {variant === 'highlight' && (
                <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse z-10">
                    PRÓXIMA
                </div>
            )}
        </div>
    );
}