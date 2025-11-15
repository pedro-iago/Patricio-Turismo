import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// ✅ 1. IMPORTE OS COMPONENTES DE CARD
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
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

// ... (Interfaces: TripDto, Bus, TripComOnibus, Page - SEM ALTERAÇÃO) ...
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

  const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ... (Lógica de fetch, handle, filter, etc. - SEM ALTERAÇÃO) ...
  const fetchTripsAndBuses = async (page = 0) => {
    try {
      const [tripsResponse, busesResponse] = await Promise.all([
        api.get<Page<TripDto>>(`/api/viagem?page=${page}&size=10`),
        api.get<Bus[]>('/api/onibus')
      ]);

      const busData = busesResponse.data;
      const newBusMap = new Map<number, Bus>();
      busData.forEach(bus => {
        newBusMap.set(bus.id, bus); // Usa bus.id
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

  useEffect(() => {
    fetchTripsAndBuses(currentPage);
  }, [currentPage]);

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
    // ... (lógica da paginação - SEM ALTERAÇÃO) ...
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
      {/* ... (Cabeçalho da página e Input de Busca - SEM ALTERAÇÃO) ... */}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar por placa do ônibus ou data (dd/mm/aaaa)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ✅ 2. TABELA (VISÍVEL APENAS EM DESKTOP) */}
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
            {filteredTrips.map((trip) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ 3. LISTA DE CARDS (VISÍVEL APENAS EM MOBILE) */}
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


      {/* --- PAGINAÇÃO (SEM ALTERAÇÃO) --- */}
      {totalPages > 1 && (
        <Pagination>
          {/* ... (Conteúdo da paginação sem alteração) ... */}
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


      {/* ... (Modais - SEM ALTERAÇÃO) ... */}
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