import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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

  const handleCreateTrip = async (tripData: any) => {
    try {
      await api.post('/viagem', tripData);

      setIsModalOpen(false); 
      fetchTrips(); 
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
    }
  };

  const handleUpdateTrip = async (tripData: any) => {
    if (!selectedTrip) return; 

    try {
      await api.put(`/viagem/${selectedTrip.id}`, tripData);

      setSelectedTrip(null);
      setIsModalOpen(false);
      fetchTrips();
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
    }
  };

  const handleDeleteTrip = async () => { 
      if (!deleteTrip) return; 

      try {
        await api.delete(`/viagem/${deleteTrip.id}`);

        setTrips(trips.filter((trip) => trip.id !== deleteTrip.id));

        setDeleteTrip(null);
        

      } catch (error) {
        console.error('Erro ao deletar viagem:', error);
      }
    };


  const openEditModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedTrip(null);
    setIsModalOpen(true);
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
            {trips.map((trip) => (
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

      {/* Os modais permanecem iguais por enquanto */}
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