import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
// ✅ ÍCONES IMPORTADOS
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import TripModal from './TripModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import  api  from '../services/api'; 
// ✅ IMPORTS DA PAGINAÇÃO (COM ELLIPSIS)
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationPrevious, 
  PaginationNext, 
  PaginationLink, 
  PaginationEllipsis // <-- ADICIONADO
} from './ui/pagination';
import axios from 'axios';
import { cn } from './ui/utils'; 

// ... (Interfaces: TripDto, Bus, TripComOnibus, Page) ...
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

  // ... (Lógica de fetch, handle, filter, etc.) ...
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

  // ✅ FUNÇÃO HELPER DA PAGINAÇÃO
  const getPaginationItems = (currentPage: number, totalPages: number) => {
    const items: (number | string)[] = [];
    const maxPageNumbers = 5; // Máximo de números visíveis (ex: 1, ..., 5, 6, 7, ..., 10)
    const pageRangeDisplayed = 1; // Quantos números antes/depois do atual

    if (totalPages <= maxPageNumbers) {
      for (let i = 0; i < totalPages; i++) {
        items.push(i);
      }
    } else {
      // Sempre mostrar a primeira página
      items.push(0);

      // Elipse ou números no início
      if (currentPage > pageRangeDisplayed + 1) {
        items.push('...');
      } else if (currentPage === pageRangeDisplayed + 1) {
        items.push(1);
      }

      // Páginas ao redor da atual
      for (let i = Math.max(1, currentPage - pageRangeDisplayed); i <= Math.min(totalPages - 2, currentPage + pageRangeDisplayed); i++) {
        if (i !== 0) {
          items.push(i);
        }
      }

      // Elipse ou números no final
      if (currentPage < totalPages - pageRangeDisplayed - 2) {
        items.push('...');
      } else if (currentPage === totalPages - pageRangeDisplayed - 2) {
        items.push(totalPages - 2);
      }

      // Sempre mostrar a última página
      if (totalPages > 1) {
         items.push(totalPages - 1);
      }
    }
    
    // Remove duplicatas (caso a primeira/última página apareça na lógica do meio)
    return [...new Set(items)];
  };

  return (
    <div className="space-y-6">
      {/* ... (Cabeçalho da página e Input de Busca) ... */}
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

      {/* ... (Tabela) ... */}
       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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

      {/* --- PAGINAÇÃO ATUALIZADA --- */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {/* Botão Anterior */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                className={cn(currentPage === 0 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>

            {/* Números de Página e Elipses */}
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

            {/* Botão Próximo */}
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
      {/* --- FIM DA PAGINAÇÃO --- */}


      {/* ... (Modais) ... */}
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