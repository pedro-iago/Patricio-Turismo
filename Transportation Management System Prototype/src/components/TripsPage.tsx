import React, { useState, useEffect } from 'react'; // Adicionar useEffect
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react'; // Adicionar Loader2
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import TripModal from './TripModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import apiClient from '../services/api'; // <-- Importar o apiClient
import { Alert, AlertDescription } from './ui/alert'; // Para erros

// Interface para os dados da API (ajustada para LocalDateTime e objeto onibus)
interface OnibusApi {
  id: number;
  placa: string;
  modelo: string;
  capacidadePassageiros: number; // Corresponde ao backend
}

interface TripApi {
  id: number;
  // origem e destino não existem na API Viagem, adicionaremos se necessário
  dataHoraPartida: string; // Vem como string ISO (ex: "2025-11-01T20:00:00")
  dataHoraChegada: string; // Vem como string ISO
  onibus: OnibusApi;
  // status precisa ser calculado no frontend
  valorPassagem?: number; // Adicionado, se existir na API
}

// Interface usada no componente (com campos formatados)
interface TripView extends TripApi {
    date: string;
    departureTime: string;
    arrivalTime: string;
    status: 'upcoming' | 'past';
}

// Função para formatar os dados da API para exibição
const formatTripData = (tripApi: TripApi): TripView => {
    const departure = new Date(tripApi.dataHoraPartida);
    const arrival = new Date(tripApi.dataHoraChegada);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
        ...tripApi,
        date: departure.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        departureTime: departure.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        arrivalTime: arrival.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: departure >= today ? 'upcoming' : 'past',
    };
};


export default function TripsPage() {
  const navigate = useNavigate();
  // Estados para dados da API, loading e erro
  const [trips, setTrips] = useState<TripView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para os modais (mantidos como antes)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripView | null>(null); // Usar TripView
  const [deleteTrip, setDeleteTrip] = useState<TripView | null>(null); // Usar TripView

  // useEffect para buscar dados da API quando o componente monta
  useEffect(() => {
    const fetchTrips = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<TripApi[]>('/viagem'); // Chama GET /viagem
        const formattedTrips = response.data.map(formatTripData); // Formata os dados
        setTrips(formattedTrips);
      } catch (err: any) {
        console.error("Erro ao buscar viagens:", err);
        // O interceptor já trata 401, aqui tratamos outros erros
         if (err.response?.status !== 401) {
             setError('Falha ao carregar viagens. Verifique a conexão com o servidor.');
         } else {
             setError('Sessão expirada. Faça login novamente.'); // Ou outra mensagem para 401
         }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, []); // Array vazio significa que executa apenas uma vez no mount

  // --- Funções de manipulação (ainda usam lógica mockada, precisam ser atualizadas) ---

  const handleCreateTrip = (tripData: Partial<TripView>) => {
     // TODO: Implementar chamada apiClient.post('/viagem', tripDataFormatadoParaApi)
    console.log("Criar Viagem (ainda mockado):", tripData);
     // Após sucesso na API, chamar fetchTrips() novamente para atualizar a lista
    setIsModalOpen(false);
  };

  const handleUpdateTrip = (tripData: Partial<TripView>) => {
    // TODO: Implementar chamada apiClient.put(`/viagem/${selectedTrip?.id}`, tripDataFormatadoParaApi)
    console.log("Atualizar Viagem (ainda mockado):", tripData);
    // Após sucesso na API, chamar fetchTrips() novamente
    setSelectedTrip(null);
    setIsModalOpen(false);
  };

  const handleDeleteTrip = async () => {
    if (deleteTrip) {
      // TODO: Implementar chamada apiClient.delete(`/viagem/${deleteTrip.id}`)
      console.log("Deletar Viagem (ainda mockado):", deleteTrip.id);
      // Após sucesso na API, chamar fetchTrips() novamente ou remover da lista local
      setTrips(trips.filter((trip) => trip.id !== deleteTrip.id)); // Remove localmente por enquanto
      setDeleteTrip(null);
    }
  };

  const openEditModal = (trip: TripView) => {
    setSelectedTrip(trip);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedTrip(null);
    setIsModalOpen(true);
  };

  // --- Renderização ---

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Todas as Viagens</h2>
          <p className="text-muted-foreground mt-1">Gerencie sua agenda de transportes</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Nova Viagem
        </Button>
      </div>

      {/* Mostra erro se houver */}
      {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              {/* <TableHead>Origin</TableHead> */}
              {/* <TableHead>Destination</TableHead> */}
              <TableHead>Data</TableHead>
              <TableHead>Partida</TableHead>
              <TableHead>Chegada</TableHead>
              <TableHead>Ônibus</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <div className="flex justify-center items-center gap-2">
                     <Loader2 className="h-5 w-5 animate-spin" /> Carregando viagens...
                  </div>
                </TableCell>
              </TableRow>
            ) : trips.length === 0 && !error ? (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                       Nenhuma viagem encontrada.
                    </TableCell>
                 </TableRow>
             ) : (
              trips.map((trip) => (
                <TableRow key={trip.id}>
                  {/* <TableCell>{trip.origin || '-'}</TableCell> */}
                  {/* <TableCell>{trip.destination || '-'}</TableCell> */}
                  <TableCell>{trip.date}</TableCell>
                  <TableCell>{trip.departureTime}</TableCell>
                  <TableCell>{trip.arrivalTime}</TableCell>
                  <TableCell>{trip.onibus?.placa || 'N/A'}</TableCell> {/* Usa a placa do ônibus */}
                  <TableCell>
                    <Badge
                      variant={trip.status === 'upcoming' ? 'default' : 'secondary'}
                      className={
                        trip.status === 'upcoming'
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : ''
                      }
                    >
                      {trip.status === 'upcoming' ? 'Próxima' : 'Passada'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/trips/${trip.id}`)} // Navega para detalhes
                        className="hover:bg-primary/10 hover:text-primary"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(trip)}
                        className="hover:bg-primary/10 hover:text-primary"
                         title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTrip(trip)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                         title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modais (ainda usam lógica mockada internamente, mas recebem dados corretos) */}
      <TripModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTrip(null);
        }}
        onSave={selectedTrip ? handleUpdateTrip : handleCreateTrip}
        trip={selectedTrip} // Passa o trip selecionado (com dados da API)
      />

      <DeleteConfirmModal
        isOpen={!!deleteTrip}
        onClose={() => setDeleteTrip(null)}
        onConfirm={handleDeleteTrip} // Ainda precisa chamar a API
        title="Excluir Viagem"
        description={`Tem certeza que deseja excluir a viagem com ID ${deleteTrip?.id}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}