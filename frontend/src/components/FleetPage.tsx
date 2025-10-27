import React, { useState, useEffect } from 'react'; 
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import BusModal from './BusModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';

interface Bus {
  idOnibus: number; 
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

interface BusDto {
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}



export default function FleetPage() {
  const [buses, setBuses] = useState<Bus[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [deleteBus, setDeleteBus] = useState<Bus | null>(null);

  const fetchBuses = async () => {
    try {
      const response = await api.get('/onibus'); 
      setBuses(response.data);
    } catch (error) {
      console.error("Erro ao buscar ônibus:", error);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);


  const handleCreateBus = async (busData: BusDto) => {
    try {
      await api.post('/onibus', busData);
      setIsModalOpen(false);
      await fetchBuses(); 
    } catch (error) {
      console.error("Erro ao criar ônibus:", error);
    }
  };

  const handleUpdateBus = async (busData: BusDto) => {
    if (!selectedBus) return;
    try {
      await api.put(`/onibus/${selectedBus.idOnibus}`, busData);
      setSelectedBus(null);
      setIsModalOpen(false);
      await fetchBuses(); 
    } catch (error) {
      console.error("Erro ao atualizar ônibus:", error);
    }
  };

  const handleDeleteBus = async () => {
    if (!deleteBus) return;
    try {
      await api.delete(`/onibus/${deleteBus.idOnibus}`);
      setDeleteBus(null);
      await fetchBuses(); 
    } catch (error) {
      console.error("Erro ao deletar ônibus:", error);
    }
  };

  const openEditModal = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedBus(null);
    setIsModalOpen(true);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Frota</h2>
          <p className="text-muted-foreground mt-1">Gerencie sua frota de ônibus</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Novo ônibus
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Capacidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buses.map((bus) => (
              <TableRow key={bus.idOnibus}>
                {/* Usa os nomes de campos corretos */}
                <TableCell>{bus.placa}</TableCell>
                <TableCell>{bus.modelo}</TableCell>
                <TableCell>{bus.capacidadePassageiros} seats</TableCell>

                {/* Célula 'Status' REMOVIDA */}

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(bus)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteBus(bus)}
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

      <BusModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBus(null);
        }}
        onSave={selectedBus ? handleUpdateBus : handleCreateBus}
        bus={selectedBus}
      />

      <DeleteConfirmModal
        isOpen={!!deleteBus}
        onClose={() => setDeleteBus(null)}
        onConfirm={handleDeleteBus}
        title="Excluir ônibus"
        description={`Tem certeza de que deseja excluir o ônibus ${deleteBus?.placa}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}