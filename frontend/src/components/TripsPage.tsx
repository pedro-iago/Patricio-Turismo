import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import TripModal from './TripModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis
} from './ui/pagination';
import axios from 'axios';

interface TripDto {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibusId: number;
}
interface Bus {
  id: number;
  placa: string;
  modelo: string;
}
interface TripComOnibus extends TripDto {
  onibus: Bus | undefined;
}
interface Page<T> {
  content: T[];
  totalPages: number;
  number: number;
}

export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripComOnibus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripComOnibus | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<TripComOnibus | null>(null);
  
  // Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Gera lista de anos
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => (currentYear - 1) + i);
  const months = [
    { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  // --- BUSCA NO SERVIDOR (Debounce) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTripsAndBuses(0); // Volta para a pág 0 ao buscar
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedMonth, selectedYear]); // Reage a qualquer filtro

  const fetchTripsAndBuses = async (page = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '10');
      params.append('sort', 'dataHoraPartida,desc');
      
      if (selectedMonth !== 'all') params.append('mes', selectedMonth);
      if (selectedYear !== 'all') params.append('ano', selectedYear);
      // Adicionamos a query de texto se houver
      if (searchTerm) params.append('query', searchTerm); 

      // Nota: Se a rota padrão /api/viagem não aceitar 'query', 
      // você precisará criar um endpoint /api/viagem/search no backend
      // ou adaptar aqui para usar api.get(`/api/viagem/search?${params}`)
      
      const [tripsResponse, busesResponse] = await Promise.all([
        api.get<Page<TripDto>>(`/api/viagem?${params.toString()}`),
        api.get<Bus[]>('/api/onibus')
      ]);

      const busData = busesResponse.data;
      const newBusMap = new Map<number, Bus>();
      busData.forEach(bus => { newBusMap.set(bus.id, bus); });

      const combinedTrips = tripsResponse.data.content.map(tripDto => ({
        ...tripDto,
        onibus: newBusMap.get(tripDto.onibusId)
      }));

      setTrips(combinedTrips);
      setTotalPages(tripsResponse.data.totalPages);
      setCurrentPage(tripsResponse.data.number);

    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      setTrips([]);
    } finally {
        setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchTripsAndBuses(newPage);
    }
  };

  const handleFilterChange = (type: 'month' | 'year', value: string) => {
    if (type === 'month') setSelectedMonth(value);
    if (type === 'year') setSelectedYear(value);
    setCurrentPage(0); // O useEffect vai disparar a busca
  };

  const clearFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSearchTerm('');
    setCurrentPage(0);
  };

  // ... (CRUD Handlers mantidos: create, update, delete) ...
  const handleCreateTrip = async (tripData: any) => { try { await api.post('/api/viagem', tripData); setIsModalOpen(false); fetchTripsAndBuses(0); } catch (e) { console.error(e); alert("Erro ao criar"); } };
  const handleUpdateTrip = async (tripData: any) => { if(!selectedTrip) return; try { await api.put(`/api/viagem/${selectedTrip.id}`, tripData); setSelectedTrip(null); setIsModalOpen(false); fetchTripsAndBuses(currentPage); } catch (e) { console.error(e); } };
  const handleDeleteTrip = async () => { if(!deleteTrip) return; try { await api.delete(`/api/viagem/${deleteTrip.id}`); setDeleteTrip(null); fetchTripsAndBuses(currentPage); } catch (e) { console.error(e); } };

  const openEditModal = (trip: TripComOnibus) => { setSelectedTrip(trip); setIsModalOpen(true); };
  const openCreateModal = () => { setSelectedTrip(null); setIsModalOpen(true); };

  const getPaginationItems = (currentPage: number, totalPages: number) => {
    const items: (number | string)[] = [];
    const maxPageNumbers = 5;
    if (totalPages <= maxPageNumbers) { for (let i = 0; i < totalPages; i++) items.push(i); }
    else { /* Lógica simplificada para brevidade */ items.push(0, '...', totalPages - 1); }
    return [...new Set(items)];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Todas as viagens</h2>
          <p className="text-muted-foreground mt-1">Gerencie sua programação de transporte</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" /> Nova viagem
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar placa ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={(val) => handleFilterChange('month', val)}>
            <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos Meses</SelectItem>{months.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={(val) => handleFilterChange('year', val)}>
            <SelectTrigger className="w-[120px] bg-white"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos Anos</SelectItem>{years.map((y) => (<SelectItem key={y} value={y.toString()}>{y}</SelectItem>))}</SelectContent>
          </Select>
          {(selectedMonth !== 'all' || selectedYear !== 'all' || searchTerm) && (
             <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar"><X className="w-4 h-4 text-red-500" /></Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Partida</TableHead><TableHead>Chegada</TableHead><TableHead>Ônibus</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow> :
             trips.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhuma viagem encontrada.</TableCell></TableRow> :
             trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{new Date(trip.dataHoraPartida).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(trip.dataHoraPartida).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</TableCell>
                  <TableCell>{new Date(trip.dataHoraChegada).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</TableCell>
                  <TableCell>{trip.onibus?.placa || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/trips/${trip.id}`)} className="hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(trip)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTrip(trip)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>

      {/* LISTA MOBILE */}
      <div className="block md:hidden space-y-4">
        {loading ? <div className="text-center p-4">Carregando...</div> : trips.map((trip) => (
          <Card key={trip.id} className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Data: {new Date(trip.dataHoraPartida).toLocaleDateString()}</CardTitle>
              <CardDescription>Ônibus: {trip.onibus?.placa || 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium text-muted-foreground">Partida: </span>{new Date(trip.dataHoraPartida).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
              <div><span className="font-medium text-muted-foreground">Chegada: </span>{new Date(trip.dataHoraChegada).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/trips/${trip.id}`)} className="hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => openEditModal(trip)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTrip(trip)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn(currentPage === 0 ? "opacity-50 pointer-events-none" : "")} /></PaginationItem>
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn(currentPage >= totalPages - 1 ? "opacity-50 pointer-events-none" : "")} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <TripModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedTrip(null); }} onSave={selectedTrip ? handleUpdateTrip : handleCreateTrip} trip={selectedTrip} />
      <DeleteConfirmModal isOpen={!!deleteTrip} onClose={() => setDeleteTrip(null)} onConfirm={handleDeleteTrip} title="Excluir viagem" description="Tem certeza?" />
    </div>
  );
}