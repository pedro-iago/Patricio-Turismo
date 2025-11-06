import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
// ÍCONE DE BUSCA ADICIONADO
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// INPUT ADICIONADO
import { Input } from './ui/input'; 
import TripModal from './TripModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import  api  from '../services/api'; 

interface Bus {
  idOnibus: number; 
  modelo: string;
  placa: string;
  capacidadePassageiros: number;
}

interface Trip {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string; 
  onibus: Bus; 
}

export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);

  // --- NOVO ESTADO PARA A BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrips = async () => {
    try {
      const response = await api.get('/viagem'); 
      setTrips(response.data);
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []); 

  // --- Funções de CRUD (sem mudanças) ---
  const handleCreateTrip = async (tripData: any) => { /* ... */ };
  const handleUpdateTrip = async (tripData: any) => { /* ... */ };
  const handleDeleteTrip = async () => { /* ... */ };
  const openEditModal = (trip: Trip) => { /* ... */ };
  const openCreateModal = () => { /* ... */ };

  // --- LÓGICA DE FILTRO ---
  const filteredTrips = trips.filter(trip => {
    const searchLower = searchTerm.toLowerCase();
    const dataFormatada = new Date(trip.dataHoraPartida).toLocaleDateString();
    return (
      dataFormatada.includes(searchLower) ||
      trip.onibus.placa.toLowerCase().includes(searchLower)
    );
  });

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

      {/* --- BARRA DE BUSCA ADICIONADA --- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar por data ou placa do ônibus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Partida</TableHead>
              <TableHead>Chegada</TableHead>
              <TableHead>Ônibus</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* --- MUDANÇA: .map() usa filteredTrips --- */}
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
                <TableCell>{trip.onibus.placa}</TableCell>
                
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