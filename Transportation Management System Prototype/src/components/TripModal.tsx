import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import apiClient from '../services/api';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2 } from 'lucide-react';

// Interface para o Ônibus vindo da API
interface OnibusApi {
  id: number;
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

// Interface para os dados da Viagem que a API espera
interface TripPayload {
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibusId: number;
}

// Interface para a Viagem existente (edição)
interface TripView {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibus: OnibusApi;
}

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trip?: TripView | null;
}

export default function TripModal({
  isOpen,
  onClose,
  onSuccess,
  trip
}: TripModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    departureTime: '',
    arrivalTime: '',
    busId: ''
  });

  const [buses, setBuses] = useState<OnibusApi[]>([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca ônibus
  const fetchBuses = async () => {
    setIsLoadingBuses(true);
    setError(null);
    try {
      const response = await apiClient.get<OnibusApi[]>('/onibus');
      setBuses(response.data);
    } catch (err) {
      console.error('Erro ao buscar ônibus:', err);
      setError('Falha ao carregar lista de ônibus.');
    } finally {
      setIsLoadingBuses(false);
    }
  };

  // Quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchBuses();

      if (trip) {
        const departure = new Date(trip.dataHoraPartida);
        const arrival = new Date(trip.dataHoraChegada);
        setFormData({
          date: departure.toISOString().split('T')[0],
          departureTime: departure.toTimeString().substring(0, 5),
          arrivalTime: arrival.toTimeString().substring(0, 5),
          busId: trip.onibus?.id.toString() || ''
        });
      } else {
        setFormData({
          date: '',
          departureTime: '',
          arrivalTime: '',
          busId: ''
        });
      }
    }
  }, [trip, isOpen]);

  // Combina data e hora
  const combineDateTime = (dateStr: string, timeStr: string): string | null => {
    if (!dateStr || !timeStr) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) {
      console.error('Formato inválido de data ou hora:', dateStr, timeStr);
      return null;
    }
    return `${dateStr}T${timeStr}:00`;
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const dataHoraPartidaISO = combineDateTime(
      formData.date,
      formData.departureTime
    );
    const dataHoraChegadaISO = combineDateTime(
      formData.date,
      formData.arrivalTime
    );

    if (!dataHoraPartidaISO || !dataHoraChegadaISO) {
      setError('Formato de data ou hora inválido.');
      setIsSaving(false);
      return;
    }

    const payload: TripPayload = {
      dataHoraPartida: dataHoraPartidaISO,
      dataHoraChegada: dataHoraChegadaISO,
      onibusId: parseInt(formData.busId)
    };

    try {
      if (trip) {
        await apiClient.put(`/viagem/${trip.id}`, payload);
      } else {
        await apiClient.post('/viagem', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar viagem:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(
          `Erro ${err.response.status}: ${
            err.response.data?.message || 'Falha ao salvar viagem.'
          }`
        );
      } else {
        setError('Erro de conexão ao salvar viagem.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{trip ? 'Editar Viagem' : 'Nova Viagem'}</DialogTitle>
          <DialogDescription>
            {trip
              ? 'Atualize os detalhes da viagem abaixo.'
              : 'Preencha as informações para criar uma nova viagem.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus">Ônibus</Label>
              <Select
                value={formData.busId}
                onValueChange={(value) =>
                  setFormData({ ...formData, busId: value })
                }
                required
                disabled={isSaving || isLoadingBuses}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingBuses ? 'Carregando...' : 'Selecione o ônibus'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingBuses ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : buses.length === 0 ? (
                    <SelectItem value="no-buses" disabled>
                      Nenhum ônibus cadastrado
                    </SelectItem>
                  ) : (
                    buses.map((bus) => (
                      <SelectItem key={bus.id} value={bus.id.toString()}>
                        {bus.placa} - {bus.modelo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureTime">Hora Partida</Label>
              <Input
                id="departureTime"
                type="time"
                value={formData.departureTime}
                onChange={(e) =>
                  setFormData({ ...formData, departureTime: e.target.value })
                }
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Hora Chegada</Label>
              <Input
                id="arrivalTime"
                type="time"
                value={formData.arrivalTime}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalTime: e.target.value })
                }
                required
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSaving || isLoadingBuses}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : trip ? (
                'Atualizar Viagem'
              ) : (
                'Criar Viagem'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
