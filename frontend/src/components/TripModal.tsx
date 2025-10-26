import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import api from '../services/api'; // 1. Importa nossa API

// Interface para o objeto Onibus (baseado no seu Onibus.java)
interface Bus {
  idOnibus: number;
  placa: string;
  modelo: string;
}

// Interface para o objeto Viagem (baseado no seu Viagem.java)
interface Trip {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibus: Bus;
}

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: any) => void; // A página pai vai lidar com a lógica de salvar
  trip: Trip | null; // Recebe a viagem real
}

// DTO para o formulário (corresponde ao seu ViagemDto.java)
interface TripFormData {
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibusId: string; // O <Select> trabalha melhor com strings
}

// Helper para formatar "2025-10-28T08:00:00" -> "2025-10-28T08:00"
// O input datetime-local precisa do formato sem os segundos
const formatDateTimeForInput = (isoString: string | undefined) => {
  if (!isoString) return '';
  // Garante que a string tem pelo menos 16 caracteres antes de fatiar
  if (isoString.length >= 16) {
    return isoString.slice(0, 16); // Retorna "YYYY-MM-DDTHH:MM"
  }
  return isoString; // Retorna a string original se for inválida
};

export default function TripModal({ isOpen, onClose, onSave, trip }: TripModalProps) {
  // 2. Estado do formulário agora espelha seu ViagemDto.java
  const [formData, setFormData] = useState<TripFormData>({
    dataHoraPartida: '',
    dataHoraChegada: '',
    onibusId: '',
  });

  // 3. Estado para guardar a lista real de ônibus
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(false);

  // 4. Efeito para buscar os ônibus da API quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const fetchBuses = async () => {
        setLoadingBuses(true);
        try {
          // 5. Chama o endpoint GET /onibus do seu OnibusController
          const response = await api.get('/onibus');
          setBuses(response.data);
        } catch (error) {
          console.error("Erro ao buscar ônibus:", error);
        }
        setLoadingBuses(false);
      };
      fetchBuses();
    }
  }, [isOpen]); // Roda toda vez que 'isOpen' muda para true

  // 6. Efeito para popular o formulário se estivermos editando uma viagem
  useEffect(() => {
    if (trip && isOpen) {
      // Modo "Editar"
      setFormData({
        dataHoraPartida: formatDateTimeForInput(trip.dataHoraPartida),
        dataHoraChegada: formatDateTimeForInput(trip.dataHoraChegada),
        onibusId: trip.onibus?.idOnibus?.toString() || '', // Adicionado safe navigation
      });
    } else {
      // Modo "Criar Novo" (reseta o formulário)
      setFormData({
        dataHoraPartida: '',
        dataHoraChegada: '',
        onibusId: '',
      });
    }
  }, [trip, isOpen]); // Roda se a 'trip' mudar ou o modal abrir


  // --- FUNÇÃO handleSubmit ATUALIZADA ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Pega os dados do formulário
    const { dataHoraPartida, dataHoraChegada, onibusId } = formData;

    // 2. Validação básica (garante que não estão vazios)
    if (!dataHoraPartida || !dataHoraChegada || !onibusId) {
        alert("Por favor, preencha todas as datas/horas e selecione um ônibus.");
        return;
    }

    // 3. Formata as datas para incluir segundos (:00)
    // Verifica se os segundos já não estão presentes
    const formattedPartida = dataHoraPartida.length === 16 ? `${dataHoraPartida}:00` : dataHoraPartida;
    const formattedChegada = dataHoraChegada.length === 16 ? `${dataHoraChegada}:00` : dataHoraChegada;

    // 4. Prepara o DTO para enviar ao backend
    const tripDataToSave = {
      dataHoraPartida: formattedPartida, // Usa a string formatada
      dataHoraChegada: formattedChegada, // Usa a string formatada
      onibusId: parseInt(onibusId, 10), // Converte para número
    };

    console.log("Enviando DTO para onSave (Update/Create):", tripDataToSave); // Log para debug

    // 5. Chama a função onSave (handleCreateTrip ou handleUpdateTrip)
    onSave(tripDataToSave);
  };
  // --- FIM DA ATUALIZAÇÃO ---


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

          {/* Inputs de Data/Hora */}
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

          {/* Dropdown de Ônibus */}
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
                {/* Adicionado filter para garantir que bus.idOnibus existe */}
                {buses.filter(bus => bus && bus.idOnibus).map((bus) => (
                  <SelectItem key={bus.idOnibus} value={bus.idOnibus.toString()}>
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