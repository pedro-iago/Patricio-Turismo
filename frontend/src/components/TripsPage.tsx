import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
// ✅ 1. IMPORTS DOS SELECTS
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
import { cn } from './ui/utils';

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
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ 2. ESTADOS DOS FILTROS
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Gera lista de anos (Ano atual - 1 até Ano atual + 2)
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

  const fetchTripsAndBuses = async (page = 0) => {
    try {
      // Construção dos Parâmetros de Consulta
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '10');
      // ✅ 3. ORDENAÇÃO (Mais recente primeiro)
      params.append('sort', 'dataHoraPartida,desc');
      
      // ✅ 4. FILTROS (Enviados ao backend)
      if (selectedMonth !== 'all') params.append('mes', selectedMonth);
      if (selectedYear !== 'all') params.append('ano', selectedYear);

      const [tripsResponse, busesResponse] = await Promise.all([
        api.get<Page<TripDto>>(`/api/viagem?${params.toString()}`),
        api.get<Bus[]>('/api/onibus')
      ]);

      const busData = busesResponse.data;
      const newBusMap = new Map<number, Bus>();
      busData.forEach(bus => {
        newBusMap.set(bus.id, bus);
      });
      setBusMap(newBusMap);

      const combinedTrips = tripsResponse.data.content.map(tripDto => ({
        ...tripDto,
        onibus: newBusMap.get(tripDto.onibusId)
      }));

      setTrips(combinedTrips);
      setTotalPages(tripsResponse.data.totalPages);
      setCurrentPage(tripsResponse.data.number);

    } catch (error) {
      console.error('Erro ao buscar viagens ou ônibus:', error);
    }
  };

  // Atualiza sempre que a página ou os filtros mudarem
  useEffect(() => {
    fetchTripsAndBuses(currentPage);
  }, [currentPage, selectedMonth, selectedYear]);

  // Reseta para a primeira página quando mudar o filtro
  const handleFilterChange = (type: 'month' | 'year', value: string) => {
    if (type === 'month') setSelectedMonth(value);
    if (type === 'year') setSelectedYear(value);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSearchTerm('');
    setCurrentPage(0);
  };

  const handleCreateTrip = async (tripData: any) => {
    try {
      await api.post('/api/viagem', tripData);
      setIsModalOpen(false);
      fetchTripsAndBuses(currentPage);
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
      if (axios.isAxiosError(error) && error.response && error.response.data) {
        const backendMessage = typeof error.response.data === 'string' ? error.response.data : error.response.data?.message || 'Erro de validação no servidor.';
        alert(`Falha ao criar viagem: ${backendMessage}`);
      }
    }
  };

  const handleUpdateTrip = async (tripData: any) => {
    if (!selectedTrip) return;
    try {
      await api.put(`/api/viagem/${selectedTrip.id}`, tripData);
      setSelectedTrip(null);
      setIsModalOpen(false);
      fetchTripsAndBuses(currentPage);
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
    }
  };

  const handleDeleteTrip = async () => {
    if (!deleteTrip) return;
    try {
      await api.delete(`/api/viagem/${deleteTrip.id}`);
      setDeleteTrip(null);
      fetchTripsAndBuses(currentPage);
    } catch (error) {
      console.error('Erro ao deletar viagem:', error);
    }
  };

  const openEditModal = (trip: TripComOnibus) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedTrip(null);
    setIsModalOpen(true);
  };

  // Filtro local apenas para a busca de texto (Placa/Data String)
  const filteredTrips = trips.filter(trip => {
    const searchLower = searchTerm.toLowerCase();
    const partidaDate = new Date(trip.dataHoraPartida).toLocaleDateString();
    const busPlaca = trip.onibus?.placa || '';

    return (
      busPlaca.toLowerCase().includes(searchLower) ||
      partidaDate.includes(searchLower)
    );
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPaginationItems = (currentPage: number, totalPages: number) => {
    const items: (number | string)[] = [];
    const maxPageNumbers = 5;
    const pageRangeDisplayed = 1;
    if (totalPages <= maxPageNumbers) { for (let i = 0; i < totalPages; i++) { items.push(i); } }
    else { items.push(0); if (currentPage > pageRangeDisplayed + 1) { items.push('...'); }
    else if (currentPage === pageRangeDisplayed + 1) { items.push(1); }
    for (let i = Math.max(1, currentPage - pageRangeDisplayed); i <= Math.min(totalPages - 2, currentPage + pageRangeDisplayed); i++) { if (i !== 0) { items.push(i); } }
    if (currentPage < totalPages - pageRangeDisplayed - 2) { items.push('...'); }
    else if (currentPage === totalPages - pageRangeDisplayed - 2) { items.push(totalPages - 2); }
    if (totalPages > 1) { items.push(totalPages - 1); } }
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
          <Plus className="w-4 h-4" />
          Nova viagem
        </Button>
      </div>

      {/* ✅ 5. ÁREA DE FILTROS ATUALIZADA */}
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
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Meses</SelectItem>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={(val) => handleFilterChange('year', val)}>
            <SelectTrigger className="w-[120px] bg-white">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Anos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedMonth !== 'all' || selectedYear !== 'all' || searchTerm) && (
             <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar Filtros">
               <X className="w-4 h-4 text-red-500" />
             </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow key="header-row">
              <TableHead>Data</TableHead>
              <TableHead>Partida</TableHead>
              <TableHead>Chegada</TableHead>
              <TableHead>Ônibus</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                   Nenhuma viagem encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    {new Date(trip.dataHoraPartida).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(trip.dataHoraPartida).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(trip.dataHoraChegada).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{trip.onibus?.placa || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/trips/${trip.id}`)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(trip)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTrip(trip)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="block md:hidden space-y-4">
        {filteredTrips.map((trip) => (
          <Card key={trip.id} className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>
                Data: {new Date(trip.dataHoraPartida).toLocaleDateString()}
              </CardTitle>
              <CardDescription>
                Ônibus: {trip.onibus?.placa || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Partida: </span>
                {new Date(trip.dataHoraPartida).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Chegada: </span>
                {new Date(trip.dataHoraChegada).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="hover:bg-primary/10 hover:text-primary"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditModal(trip)}
                className="hover:bg-primary/10 hover:text-primary"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTrip(trip)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                className={cn(currentPage === 0 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>
            {getPaginationItems(currentPage, totalPages).map((pageItem, index) => (
              <PaginationItem key={index}>
                {typeof pageItem === 'string' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={pageItem === currentPage}
                    onClick={(e) => { e.preventDefault(); handlePageChange(pageItem as number); }}
                  >
                    {(pageItem as number) + 1}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                className={cn(currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <TripModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrip(null);
        }}
        onSave={selectedTrip ? handleUpdateTrip : handleCreateTrip}
        trip={selectedTrip}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTrip}
        onClose={() => setDeleteTrip(null)}
        onConfirm={handleDeleteTrip}
        title="Excluir viagem"
        description={`Tem certeza de que deseja excluir esta viagem? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}