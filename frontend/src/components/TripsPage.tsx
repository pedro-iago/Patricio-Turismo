import React, { useState, useEffect } from 'react'; // 1. useEffect importado
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// 3. Badge removido (não precisamos mais de status)
// import { Badge } from './ui/badge'; 
import TripModal from './TripModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import  api  from '../services/api'; // 2. API importada

// Interface para o Onibus (que agora vem aninhado)
interface Bus {
  idOnibus: number; // Combine com o seu Onibus.java
  modelo: string;
  placa: string;
  capacidadePassageiros: number;
}

// Interface principal da Viagem (Trip) - agora espelha seu backend
interface Trip {
  id: number;
  dataHoraPartida: string; // Vem como string ISO (ex: "2025-10-28T08:00:00")
  dataHoraChegada: string; // Vem como string ISO
  onibus: Bus; // Objeto Onibus aninhado
}

// Mock trips removido
// const mockTrips: Trip[] = [ ... ];

export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]); // 4. Começa vazio
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [deleteTrip, setDeleteTrip] = useState<Trip | null>(null);

  // 5. Função para buscar dados da API
  const fetchTrips = async () => {
    try {
      // Usando o endpoint /viagem do seu ViagemController
      const response = await api.get('/viagem'); 
      setTrips(response.data);
    } catch (error) {
      console.error('Erro ao buscar viagens:', error);
      // Aqui você pode adicionar um toast ou mensagem de erro
    }
  };

  // 6. useEffect para chamar a função fetchTrips() quando a página carregar
  useEffect(() => {
    fetchTrips();
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  // --- Funções de Salvar, Atualizar e Deletar (AINDA USAM LÓGICA MOCK) ---
  // --- Vamos conectar elas com a API no próximo passo ---
  const handleCreateTrip = async (tripData: any) => {
    // tripData é o objeto que o modal nos enviou: 
    // { dataHoraPartida, dataHoraChegada, onibusId }
    try {
      // Chama o endpoint POST /viagem do seu ViagemController
      await api.post('/viagem', tripData);
      
      // (Opcional) Adicione um toast de sucesso
      // toast.success("Viagem criada com sucesso!");

      setIsModalOpen(false); // Fecha o modal
      fetchTrips(); // Recarrega a lista da API para mostrar a nova viagem
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
      // (Opcional) Adicione um toast de erro
      // toast.error("Falha ao criar viagem.");
    }
  };

// Substitua sua função 'handleUpdateTrip' por esta:
  const handleUpdateTrip = async (tripData: any) => {
    if (!selectedTrip) return; // Segurança

    try {
      // Chama o endpoint PUT /viagem/{id} do seu ViagemController
      await api.put(`/viagem/${selectedTrip.id}`, tripData);

      // (Opcional) Adicione um toast de sucesso
      // toast.success("Viagem atualizada com sucesso!");

      setSelectedTrip(null);
      setIsModalOpen(false);
      fetchTrips(); // Recarrega a lista da API
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
      // (Opcional) Adicione um toast de erro
      // toast.error("Falha ao atualizar viagem.");
    }
  };

  const handleDeleteTrip = async () => { // 1. Adicionado 'async'
      if (!deleteTrip) return; // Segurança: não faz nada se deleteTrip for nulo

      try {
        // 2. Chama o endpoint do seu ViagemController (DELETE /viagem/{id})
        await api.delete(`/viagem/${deleteTrip.id}`);

        // 3. Sucesso! Remove a viagem da lista do frontend (sem precisar recarregar a página)
        setTrips(trips.filter((trip) => trip.id !== deleteTrip.id));

        // 4. Fecha o modal de confirmação
        setDeleteTrip(null);
        
        // (Opcional) Você pode adicionar um toast de sucesso aqui
        // toast.success("Viagem deletada com sucesso!");

      } catch (error) {
        console.error('Erro ao deletar viagem:', error);
        // (Opcional) Adicionar um toast de erro se falhar
        // toast.error("Falha ao deletar viagem.");
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
            {/* 7. Cabeçalhos da tabela atualizados */}
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
                {/* 8. Células de dados atualizadas */}
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
                {/* 9. Acesso ao dado aninhado */}
                <TableCell>{trip.onibus.placa}</TableCell>
                
                {/* Célula de Status Removida */}

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
        // Descrição do modal simplificada
        description={`Tem certeza de que deseja excluir esta viagem? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}