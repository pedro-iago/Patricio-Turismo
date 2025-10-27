import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Briefcase, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import PassengerModal from './PassengerModal';
import PackageModal from './PackageModal';
import LuggageModal from './LuggageModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Skeleton } from './ui/skeleton';

// --- Interfaces ---

interface Bus {
  idOnibus: number;
  modelo: string;
  placa: string;
}

interface Trip {
  id: number;
  dataHoraPartida: string;
  dataHoraChegada: string;
  onibus: Bus;
}

interface Person {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
}

interface Address {
  id: number;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface PassengerData {
  id: number;
  pessoa: Person;
  viagem: Trip;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  luggageCount: number;
}

interface PackageData {
  id: number;
  descricao: string;
  peso: number;
  remetente: Person;
  destinatario: Person;
  enderecoColeta: Address;
  enderecoEntrega: Address;
}

const formatAddress = (addr: Address) => {
  if (!addr) return 'Endereço inválido';
  return `${addr.logradouro}, ${addr.numero} - ${addr.bairro}, ${addr.cidade}`;
};

export default function TripDetailsPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<PassengerData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'passenger' | 'package'; item: any } | null>(null);
  const [passengerSearchTerm, setPassengerSearchTerm] = useState('');
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      if (!tripId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [tripResponse, passengersResponse, packagesResponse] = await Promise.all([
          api.get(`/viagem/${tripId}`),
          api.get(`/passageiroviagem/viagem/${tripId}`),
          api.get(`/encomenda/viagem/${tripId}`)
        ]);

        const passengersData: PassengerData[] = passengersResponse.data;

        const passengersWithLuggage = await Promise.all(
          passengersData.map(async (passenger) => {
            const luggageResponse = await api.get(`/bagagem/passageiro/${passenger.id}`);
            const correctedPassenger = {
                ...passenger,
                pessoa: {
                    ...passenger.pessoa,
                    idPessoa: passenger.pessoa.id
                }
            };
            return {
              ...correctedPassenger,
              luggageCount: luggageResponse.data.length
            };
          })
        );

        setTrip(tripResponse.data);
        setPassengers(passengersWithLuggage);
        setPackages(packagesResponse.data);

      } catch (error) {
        console.error('Erro ao buscar detalhes da viagem:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [tripId]);

  const refreshData = async () => {
    if (!tripId) return;
    try {
      const [passengersResponse, packagesResponse] = await Promise.all([
        api.get(`/passageiroviagem/viagem/${tripId}`),
        api.get(`/encomenda/viagem/${tripId}`)
      ]);

      const passengersData: PassengerData[] = passengersResponse.data;

      const passengersWithLuggage = await Promise.all(
        passengersData.map(async (passenger) => {
          const luggageResponse = await api.get(`/bagagem/passageiro/${passenger.id}`);
           const correctedPassenger = {
            ...passenger,
            pessoa: {
                ...passenger.pessoa,
                idPessoa: passenger.pessoa.id
            }
          };
          return {
            ...correctedPassenger,
            luggageCount: luggageResponse.data.length
          };
        })
      );

      setPassengers(passengersWithLuggage);
      setPackages(packagesResponse.data);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }
  };

  const handleSavePassenger = async (passengerDto: { personId: number; pickupAddressId: number; dropoffAddressId: number }) => {
    const fullDto = {
      pessoaId: passengerDto.personId,             
      viagemId: parseInt(tripId!),
      enderecoColetaId: passengerDto.pickupAddressId, 
      enderecoEntregaId: passengerDto.dropoffAddressId 
    };

    try {
      if (selectedPassenger) {
        await api.put(`/passageiroviagem/${selectedPassenger.id}`, fullDto);
      } else {
        await api.post('/passageiroviagem', fullDto);
      }
      setIsPassengerModalOpen(false);
      setSelectedPassenger(null);
      await refreshData();
    } catch (error) {
      console.error("Erro ao salvar passageiro:", error);
    }
  };

  const handleSavePackage = async (packageDto: any) => {
    const fullDto = {
      ...packageDto,
      viagemId: parseInt(tripId!),
    };

    try {
      if (selectedPackage) {
        await api.put(`/encomenda/${selectedPackage.id}`, fullDto);
      } else {
        await api.post('/encomenda', fullDto);
      }
      setIsPackageModalOpen(false);
      setSelectedPackage(null);
      await refreshData();
    } catch (error) {
      console.error("Erro ao salvar encomenda:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === 'passenger') {
        await api.delete(`/passageiroviagem/${deleteItem.item.id}`);
      } else if (deleteItem.type === 'package') {
        await api.delete(`/encomenda/${deleteItem.item.id}`);
      }
      setDeleteItem(null);
      await refreshData();
    } catch (error) {
      console.error("Erro ao deletar item:", error);
    }
  };

  const openLuggageModal = (passenger: PassengerData) => {
    setSelectedPassenger(passenger);
    setIsLuggageModalOpen(true);
  };

  const handleSaveLuggage = () => {
    setIsLuggageModalOpen(false);
    setSelectedPassenger(null);
    refreshData();
  };

  const filteredPassengers = passengers.filter((passenger) => {
    const searchLower = passengerSearchTerm.toLowerCase();
    const nameMatch = passenger.pessoa.nome.toLowerCase().includes(searchLower);
    const pickupMatch = passenger.enderecoColeta && formatAddress(passenger.enderecoColeta).toLowerCase().includes(searchLower);
    const dropoffMatch = passenger.enderecoEntrega && formatAddress(passenger.enderecoEntrega).toLowerCase().includes(searchLower);
    return nameMatch || pickupMatch || dropoffMatch;
});


  const filteredPackages = packages.filter((pkg) => {
    const searchLower = packageSearchTerm.toLowerCase();
    const descMatch = pkg.descricao && pkg.descricao.toLowerCase().includes(searchLower);
    const senderMatch = pkg.remetente && pkg.remetente.nome && pkg.remetente.nome.toLowerCase().includes(searchLower);
    const recipientMatch = pkg.destinatario && pkg.destinatario.nome && pkg.destinatario.nome.toLowerCase().includes(searchLower);
    return descMatch || senderMatch || recipientMatch;
  });


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center">
        <h2>Trip not found</h2>
        <Button onClick={() => navigate('/trips')} className="mt-4">
          Back to Trips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/trips')}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2>Detalhes da viagem</h2>
          <p className="text-muted-foreground mt-1">Bahia ↔ São Paulo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações de viagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-muted-foreground">Data</p>
              <p>{new Date(trip.dataHoraPartida).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Partida</p>
              <p>{new Date(trip.dataHoraPartida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Chegada</p>
              <p>{new Date(trip.dataHoraChegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ônibus</p>
              <p>{trip.onibus.placa}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Modelo</p>
              <p>{trip.onibus.modelo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="passengers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="passengers">Passageiros ({passengers.length})</TabsTrigger>
          <TabsTrigger value="packages">Encomenda({packages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="passengers" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3>Passageiros</h3>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar passageiros ou endereço..."
                  value={passengerSearchTerm}
                  onChange={(e) => setPassengerSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedPassenger(null);
                  setIsPassengerModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar passageiro
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do passageiro</TableHead>
                  <TableHead>Endereço de coleta</TableHead>
                  <TableHead>Endereço de entrega</TableHead>
                  <TableHead>Bagagem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPassengers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {passengerSearchTerm ? 'No passengers found' : 'No passengers yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPassengers.map((passenger) => (
                    // Usa passenger.id para a key da linha (PassageiroViagem ID)
                    <TableRow key={passenger.id}>
                        {/* Acessa o nome da pessoa aninhada */}
                      <TableCell>{passenger.pessoa.nome}</TableCell>
                      <TableCell>{formatAddress(passenger.enderecoColeta)}</TableCell>
                      <TableCell>{formatAddress(passenger.enderecoEntrega)}</TableCell>
                      <TableCell>{passenger.luggageCount} items</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openLuggageModal(passenger)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Briefcase className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPassenger(passenger);
                              setIsPassengerModalOpen(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ type: 'passenger', item: passenger })}
                            className="hover:bg-destructive/10 hover:text-destructive"
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
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
           <div className="flex items-center justify-between gap-4">
            <h3>Encomenda</h3>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquisar encomendas, remetente..."
                  value={packageSearchTerm}
                  onChange={(e) => setPackageSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedPackage(null);
                  setIsPackageModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Encomendas
              </Button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Remetente</TableHead>
                  <TableHead>Recebedor</TableHead>
                  <TableHead>Escolher</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {packageSearchTerm ? 'No packages found' : 'No packages yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>{pkg.descricao}</TableCell>
                      <TableCell>{pkg.remetente.nome}</TableCell>
                      <TableCell>{pkg.destinatario.nome}</TableCell>
                      <TableCell>{formatAddress(pkg.enderecoColeta)}</TableCell>
                      <TableCell>{formatAddress(pkg.enderecoEntrega)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setIsPackageModalOpen(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ type: 'package', item: pkg })}
                            className="hover:bg-destructive/10 hover:text-destructive"
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
        </TabsContent>
      </Tabs>

      <PassengerModal
        isOpen={isPassengerModalOpen}
        onClose={() => {
          setIsPassengerModalOpen(false);
          setSelectedPassenger(null);
        }}
        onSave={handleSavePassenger}
        passenger={selectedPassenger}
      />

      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={() => {
          setIsPackageModalOpen(false);
          setSelectedPackage(null);
        }}
        onSave={handleSavePackage}
        package={selectedPackage}
      />

      <LuggageModal
        isOpen={isLuggageModalOpen}
        onClose={handleSaveLuggage}
        passenger={selectedPassenger}
      />

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title={`Excluir ${deleteItem?.type === 'passageiro' ? 'Passageiro' : 'Encomenda'}`}
        description={`Tem certeza de que deseja excluir isto? ${deleteItem?.type}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}