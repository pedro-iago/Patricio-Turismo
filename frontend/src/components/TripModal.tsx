import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
  onibus: Bus;
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
  onibusId: string; 
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
    onibusId: '',
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
      setFormData({
        dataHoraPartida: formatDateTimeForInput(trip.dataHoraPartida),
        dataHoraChegada: formatDateTimeForInput(trip.dataHoraChegada),
        onibusId: trip.onibus?.id?.toString() || '', 
      });
    } else {
      setFormData({
        dataHoraPartida: '',
        dataHoraChegada: '',
        onibusId: '',
      });
    }
  }, [trip, isOpen]); 


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { dataHoraPartida, dataHoraChegada, onibusId } = formData;

    if (!dataHoraPartida || !dataHoraChegada || !onibusId) {
        alert("Por favor, preencha todas as datas/horas e selecione um ônibus.");
        return;
    }

    // Garante o formato ISO8601 completo, essencial para o Spring LocalDateTime
    const formatToIso = (dateStr: string) => {
        return dateStr.length === 16 ? `${dateStr}:00` : dateStr;
    };

    const tripDataToSave = {
      // Campos do ViagemSaveRequestDto
      dataHoraPartida: formatToIso(dataHoraPartida), 
      dataHoraChegada: formatToIso(dataHoraChegada), 
      onibusId: parseInt(onibusId, 10), 
    };

    onSave(tripDataToSave);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{trip ? 'Editar viagem' : 'Nova viagem'}</DialogTitle>
          <DialogDescription>
            Preencha as informações da viagem.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="dataHoraPartida">Data e hora de partida</Label>
            <Input
              id="dataHoraPartida"
              type="datetime-local"
              value={formData.dataHoraPartida}
              onChange={(e) => setFormData({ ...formData, dataHoraPartida: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataHoraChegada">Data e hora de chegada</Label>
            <Input
              id="dataHoraChegada"
              type="datetime-local"
              value={formData.dataHoraChegada}
              onChange={(e) => setFormData({ ...formData, dataHoraChegada: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bus">Ônibus</Label>
            <Select
              value={formData.onibusId}
              onValueChange={(value) => setFormData({ ...formData, onibusId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingBuses ? "Carregando ônibus..." : "Selecione o ônibus"} />
              </SelectTrigger>
              <SelectContent>
                {buses.filter(bus => bus && bus.id).map((bus) => (
                  <SelectItem key={bus.id} value={bus.id.toString()}>
                    {bus.placa} - {bus.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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