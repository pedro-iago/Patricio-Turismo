import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Bus as BusIcon, Users } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import BusModal from './BusModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';

interface Bus {
  id: number;
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

export default function FleetPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [deleteBus, setDeleteBus] = useState<Bus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBuses = async () => {
    try {
      const response = await api.get<Bus[]>('/api/onibus');
      setBuses(response.data);
    } catch (error) {
      console.error('Erro ao buscar frota:', error);
    }
  };

  useEffect(() => { fetchBuses(); }, []);

  const handleCreateBus = async (busData: any) => {
    try { await api.post('/api/onibus', busData); setIsModalOpen(false); fetchBuses(); } catch (error) { console.error(error); }
  };

  const handleUpdateBus = async (busData: any) => {
    if (!selectedBus) return;
    try { await api.put(`/api/onibus/${selectedBus.id}`, busData); setIsModalOpen(false); setSelectedBus(null); fetchBuses(); } catch (error) { console.error(error); }
  };

  const handleDeleteBus = async () => {
    if (!deleteBus) return;
    try { await api.delete(`/api/onibus/${deleteBus.id}`); setDeleteBus(null); fetchBuses(); } catch (error) { console.error(error); }
  };

  const filteredBuses = buses.filter(bus => 
    bus.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Frota</h2>
          <p className="text-muted-foreground">Gerencie seus veículos.</p>
        </div>
        <Button onClick={() => { setSelectedBus(null); setIsModalOpen(true); }} className="bg-orange-600 hover:bg-orange-700 gap-2 text-white">
          <Plus className="w-4 h-4" /> Novo Ônibus
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar por placa ou modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBuses.map((bus) => (
          <Card key={bus.id} className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {/* COR PADRONIZADA: LARANJA */}
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <BusIcon className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-800">{bus.placa}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">{bus.modelo}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{bus.capacidadePassageiros} Lugares</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-1 pt-0">
              <Button variant="ghost" size="icon" onClick={() => { setSelectedBus(bus); setIsModalOpen(true); }} className="text-slate-400 hover:text-orange-600">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteBus(bus)} className="text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <BusModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedBus(null); }} onSave={selectedBus ? handleUpdateBus : handleCreateBus} bus={selectedBus} />
      <DeleteConfirmModal isOpen={!!deleteBus} onClose={() => setDeleteBus(null)} onConfirm={handleDeleteBus} title="Excluir Veículo" description={`Tem certeza?`} />
    </div>
  );
}