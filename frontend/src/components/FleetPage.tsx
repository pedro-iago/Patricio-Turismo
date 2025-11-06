import React, { useState, useEffect } from 'react'; 
// ÍCONE DE BUSCA ADICIONADO
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// INPUT ADICIONADO
import { Input } from './ui/input'; 
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

  // --- NOVO ESTADO PARA A BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');

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

  // --- Funções de CRUD (sem mudanças) ---
  const handleCreateBus = async (busData: BusDto) => { /* ... */ };
  const handleUpdateBus = async (busData: BusDto) => { /* ... */ };
  const handleDeleteBus = async () => { /* ... */ };
  const openEditModal = (bus: Bus) => { /* ... */ };
  const openCreateModal = () => { /* ... */ };

  // --- LÓGICA DE FILTRO ---
  const filteredBuses = buses.filter(bus => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bus.placa.toLowerCase().includes(searchLower) ||
      bus.modelo.toLowerCase().includes(searchLower)
    );
  });

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

      {/* --- BARRA DE BUSCA ADICIONADA --- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar por placa ou modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
            {/* --- MUDANÇA: .map() usa filteredBuses --- */}
            {filteredBuses.map((bus) => (
              <TableRow key={bus.idOnibus}>
                <TableCell>{bus.placa}</TableCell>
                <TableCell>{bus.modelo}</TableCell>
                <TableCell>{bus.capacidadePassageiros} seats</TableCell>
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