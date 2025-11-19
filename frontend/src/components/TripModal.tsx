import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox'; // Importe o Checkbox
import { ScrollArea } from './ui/scroll-area'; // Importe se tiver, ou use div com overflow
import api from '../services/api'; 

interface Bus {
  id: number;
  placa: string;
  modelo: string;
}

interface Trip {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibus: Bus[]; // <-- Agora é uma lista de ônibus
}

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: any) => void; 
  trip: Trip | null; 
}

interface TripFormData {
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibusIds: string[]; // <-- Lista de IDs
}

const formatDateTimeForInput = (isoString: string | undefined) => {
  if (!isoString) return '';
  if (isoString.length >= 16) return isoString.slice(0, 16); 
  return isoString; 
};

export default function TripModal({ isOpen, onClose, onSave, trip }: TripModalProps) {
  const [formData, setFormData] = useState<TripFormData>({
    dataHoraPartida: '',
    dataHoraChegada: '',
    onibusIds: [],
  });

  const [buses, setBuses] = useState<Bus[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchBuses = async () => {
        setLoadingBuses(true);
        try {
          const response = await api.get<Bus[]>('/api/onibus');
          setBuses(response.data);
        } catch (error) {
          console.error("Erro ao buscar ônibus:", error);
        }
        setLoadingBuses(false);
      };
      fetchBuses();
    }
  }, [isOpen]); 

  useEffect(() => {
    if (trip && isOpen) {
      // Mapeia os ônibus existentes para IDs
      const existingBusIds = trip.onibus ? trip.onibus.map(b => b.id.toString()) : [];
      
      setFormData({
        dataHoraPartida: formatDateTimeForInput(trip.dataHoraPartida),
        dataHoraChegada: formatDateTimeForInput(trip.dataHoraChegada),
        onibusIds: existingBusIds, 
      });
    } else {
      setFormData({
        dataHoraPartida: '',
        dataHoraChegada: '',
        onibusIds: [],
      });
    }
  }, [trip, isOpen]); 

  // Helper para adicionar/remover ID da lista
  const toggleBusSelection = (busId: string) => {
    setFormData(prev => {
      const exists = prev.onibusIds.includes(busId);
      if (exists) {
        return { ...prev, onibusIds: prev.onibusIds.filter(id => id !== busId) };
      } else {
        return { ...prev, onibusIds: [...prev.onibusIds, busId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { dataHoraPartida, dataHoraChegada, onibusIds } = formData;

    if (!dataHoraPartida || !dataHoraChegada || onibusIds.length === 0) {
        alert("Por favor, preencha as datas e selecione pelo menos um ônibus.");
        return;
    }

    const formatToIso = (dateStr: string) => {
        return dateStr.length === 16 ? `${dateStr}:00` : dateStr;
    };

    const tripDataToSave = {
      dataHoraPartida: formatToIso(dataHoraPartida), 
      dataHoraChegada: formatToIso(dataHoraChegada), 
      onibusIds: onibusIds.map(id => parseInt(id, 10)), // Envia Array de Numbers
    };

    onSave(tripDataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{trip ? 'Editar viagem' : 'Nova viagem'}</DialogTitle>
          <DialogDescription>
            Defina datas e veículos vinculados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="dataHoraPartida">Partida</Label>
                <Input
                id="dataHoraPartida"
                type="datetime-local"
                value={formData.dataHoraPartida}
                onChange={(e) => setFormData({ ...formData, dataHoraPartida: e.target.value })}
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="dataHoraChegada">Chegada</Label>
                <Input
                id="dataHoraChegada"
                type="datetime-local"
                value={formData.dataHoraChegada}
                onChange={(e) => setFormData({ ...formData, dataHoraChegada: e.target.value })}
                required
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ônibus Vinculados</Label>
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-2 bg-slate-50">
                {loadingBuses ? (
                    <p className="text-xs text-muted-foreground">Carregando frota...</p>
                ) : (
                    buses.map(bus => (
                        <div key={bus.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                            <Checkbox 
                                id={`bus-${bus.id}`} 
                                checked={formData.onibusIds.includes(bus.id.toString())}
                                onCheckedChange={() => toggleBusSelection(bus.id.toString())}
                            />
                            <label 
                                htmlFor={`bus-${bus.id}`} 
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                                {bus.placa} - <span className="text-muted-foreground">{bus.modelo} ({bus.capacidadePassageiros} lug.)</span>
                            </label>
                        </div>
                    ))
                )}
            </div>
            <p className="text-[10px] text-muted-foreground">Selecione um ou mais veículos para esta viagem.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {trip ? 'Atualizar' : 'Criar'} Viagem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}