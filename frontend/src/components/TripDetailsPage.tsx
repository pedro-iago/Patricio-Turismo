import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Briefcase, Search, 
  Printer, 
  FileDown, 
  DollarSign 
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; 
import PassengerModal from './PassengerModal';
import PackageModal from './PackageModal';
import LuggageModal from './LuggageModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Skeleton } from './ui/skeleton';
import { CSVLink } from 'react-csv'; 

// --- Interfaces ---
interface Bus { idOnibus: number; modelo: string; placa: string; }
interface Trip { id: number; dataHoraPartida: string; dataHoraChegada: string; onibus: Bus; }
interface Person { id: number; nome: string; cpf: string; telefone: string; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

// --- DTOs dos Modais ---
interface PassengerSaveDto {
  pessoaId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  taxistaId?: number;
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}
interface PackageSaveDto {
  descricao: string;
  remetenteId: number;
  destinatarioId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  taxistaId?: number;
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

// --- Interfaces de Dados ---
interface PassengerData {
  id: number;
  pessoa: Person;
  viagem: Trip;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  luggageCount: number; 
  taxista?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}
interface PackageData {
  id: number;
  descricao: string;
  peso: number;
  remetente: Person;
  destinatario: Person;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  taxista?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

// --- Funções Auxiliares ---
const formatAddress = (addr: Address) => {
  if (!addr) return 'Endereço inválido';
  return `${addr.logradouro}, ${addr.numero} - ${addr.bairro}, ${addr.cidade}`;
};
const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};


export default function TripDetailsPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- Estados ---
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
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [filterTaxistaId, setFilterTaxistaId] = useState<string>('all');
  const [filterComisseiroId, setFilterComisseiroId] = useState<string>('all');
  const [passengerSearchTerm, setPassengerSearchTerm] = useState('');
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  // --- Funções de Busca e Handlers (LÓGICA COMPLETA RESTAURADA) ---

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!tripId) { setLoading(false); return; }
      setLoading(true);
      try {
        const [tripResponse, taxistasRes, comisseirosRes] = await Promise.all([
          api.get(`/viagem/${tripId}`),
          api.get('/api/v1/affiliates/taxistas'),
          api.get('/api/v1/affiliates/comisseiros')
        ]);
        setTrip(tripResponse.data);
        setTaxistas(taxistasRes.data);
        setComisseiros(comisseirosRes.data);
      } catch (error) { console.error('Erro ao buscar detalhes da viagem:', error); }
      finally { setLoading(false); }
    };
    fetchInitialData();
  }, [tripId]);

  const fetchFilteredData = useCallback(async () => {
    if (!tripId) return;
    let passengerUrl = `/api/v1/reports/passageiros/viagem/${tripId}`;
    let packageUrl = `/api/v1/reports/encomendas/viagem/${tripId}`;
    if (filterTaxistaId !== 'all') {
      passengerUrl += `/taxista/${filterTaxistaId}`;
      packageUrl += `/taxista/${filterTaxistaId}`;
    } else if (filterComisseiroId !== 'all') {
      passengerUrl += `/comisseiro/${filterComisseiroId}`;
      packageUrl += `/comisseiro/${filterComisseiroId}`;
    }
    try {
      setLoading(true); 
      const [passengersResponse, packagesResponse] = await Promise.all([
        api.get(passengerUrl),
        api.get(packageUrl)
      ]);
      const passengersData: PassengerData[] = passengersResponse.data;
      const passengersWithLuggage = await Promise.all(
        passengersData.map(async (passenger) => {
          const luggageResponse = await api.get(`/bagagem/passageiro/${passenger.id}`);
          return { ...passenger, luggageCount: luggageResponse.data.length };
        })
      );
      setPassengers(passengersWithLuggage);
      setPackages(packagesResponse.data);
    } catch (error) { console.error('Erro ao buscar dados filtrados:', error); }
    finally { setLoading(false); }
  }, [tripId, filterTaxistaId, filterComisseiroId]);

  useEffect(() => { fetchFilteredData(); }, [fetchFilteredData]);

  const handleSavePassenger = async (passengerDto: PassengerSaveDto) => {
    const fullDto = { ...passengerDto, viagemId: parseInt(tripId!) };
    try {
      if (selectedPassenger) {
        await api.put(`/passageiroviagem/${selectedPassenger.id}`, fullDto);
      } else {
        await api.post('/passageiroviagem', fullDto);
      }
      setIsPassengerModalOpen(false);
      setSelectedPassenger(null);
      await fetchFilteredData(); 
    } catch (error) { console.error("Erro ao salvar passageiro:", error); }
  };
  const handleSavePackage = async (packageDto: PackageSaveDto) => {
    const fullDto = { ...packageDto, viagemId: parseInt(tripId!) };
    try {
      if (selectedPackage) {
        await api.put(`/encomenda/${selectedPackage.id}`, fullDto);
      } else {
        await api.post('/encomenda', fullDto);
      }
      setIsPackageModalOpen(false);
      setSelectedPackage(null);
      await fetchFilteredData(); 
    } catch (error) { console.error("Erro ao salvar encomenda:", error); }
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
      await fetchFilteredData(); 
    } catch (error) { console.error("Erro ao deletar item:", error); }
  };
  const handleMarkAsPaid = async (type: 'passenger' | 'package', id: number) => {
    const url = type === 'passenger' ? `/passageiroviagem/${id}/marcar-pago` : `/encomenda/${id}/marcar-pago`;
    try {
      await api.patch(url);
      await fetchFilteredData(); 
    } catch (error) { console.error(`Erro ao marcar ${type} como pago:`, error); }
  };
  
  const openLuggageModal = (passenger: PassengerData) => { setSelectedPassenger(passenger); setIsLuggageModalOpen(true); };
  const handleSaveLuggage = () => { setIsLuggageModalOpen(false); setSelectedPassenger(null); fetchFilteredData(); };

  const filteredPassengers = passengers.filter((passenger) => {
    const searchLower = passengerSearchTerm.toLowerCase();
    if (!searchLower) return true; 
    const nameMatch = passenger.pessoa.nome.toLowerCase().includes(searchLower);
    const pickupMatch = passenger.enderecoColeta && formatAddress(passenger.enderecoColeta).toLowerCase().includes(searchLower);
    const dropoffMatch = passenger.enderecoEntrega && formatAddress(passenger.enderecoEntrega).toLowerCase().includes(searchLower);
    return nameMatch || pickupMatch || dropoffMatch;
  });

  const filteredPackages = packages.filter((pkg) => {
    const searchLower = packageSearchTerm.toLowerCase();
    if (!searchLower) return true;
    const descMatch = pkg.descricao && pkg.descricao.toLowerCase().includes(searchLower);
    const senderMatch = pkg.remetente && pkg.remetente.nome && pkg.remetente.nome.toLowerCase().includes(searchLower);
    const recipientMatch = pkg.destinatario && pkg.destinatario.nome && pkg.destinatario.nome.toLowerCase().includes(searchLower);
    return descMatch || senderMatch || recipientMatch;
  });

  const getPassengerCsvData = () => {
    if (!Array.isArray(filteredPassengers)) return []; 
    return filteredPassengers.map(p => ({
      Nome: p.pessoa.nome, CPF: p.pessoa.cpf, Telefone: p.pessoa.telefone,
      Coleta: formatAddress(p.enderecoColeta), Entrega: formatAddress(p.enderecoEntrega),
      Valor: p.valor, Pago: p.pago ? 'Sim' : 'Não', Metodo: p.metodoPagamento,
      Taxista: p.taxista?.pessoa.nome || '-', Comisseiro: p.comisseiro?.pessoa.nome || '-',
      Bagagem: p.luggageCount,
    }));
  };
  
  const getPackageCsvData = () => {
    if (!Array.isArray(filteredPackages)) return [];
    return filteredPackages.map(pkg => ({
        Descrição: pkg.descricao, Remetente: pkg.remetente.nome, Destinatário: pkg.destinatario.nome,
        Coleta: formatAddress(pkg.enderecoColeta), Entrega: formatAddress(pkg.enderecoEntrega),
        Valor: pkg.valor, Pago: pkg.pago ? 'Sim' : 'Não', Metodo: pkg.metodoPagamento,
        Taxista: pkg.taxista?.pessoa.nome || '-', Comisseiro: pkg.comisseiro?.pessoa.nome || '-',
    }));
  };
  
  // --- SUB-COMPONENTES PARA REUTILIZAÇÃO ---
  const PassengerTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 print-clean">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="print-col-passageiro">Passageiro</TableHead>
            <TableHead className="print-col-endereco">Coleta / Entrega</TableHead>
            <TableHead className="print-col-afiliado">Taxista / Comisseiro</TableHead>
            <TableHead className="print-col-valor">Valor</TableHead>
            <TableHead className="print-col-status">Status</TableHead>
            <TableHead className="print-col-bagagem">Bagagem</TableHead>
            <TableHead className="text-right no-print">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !trip ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Buscando dados...</TableCell></TableRow>
          ) : filteredPassengers.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{passengerSearchTerm ? 'Nenhum passageiro encontrado' : 'Nenhum passageiro nesta viagem (ou filtro)'}</TableCell></TableRow>
          ) : (
            filteredPassengers.map((passenger) => (
              <TableRow key={passenger.id}>
                <TableCell>
                  <div className="font-medium">{passenger.pessoa.nome}</div>
                  <div className="text-xs text-muted-foreground">{passenger.pessoa.cpf}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs"><b>C:</b> {formatAddress(passenger.enderecoColeta)}</div>
                  <div className="text-xs"><b>E:</b> {formatAddress(passenger.enderecoEntrega)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs"><b>T:</b> {passenger.taxista?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>C:</b> {passenger.comisseiro?.pessoa.nome || '-'}</div>
                </TableCell>
                <TableCell>{formatCurrency(passenger.valor)}</TableCell>
                <TableCell>
                  {passenger.pago ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                  )}
                </TableCell>
                <TableCell>{passenger.luggageCount} items</TableCell>
                <TableCell className="text-right no-print">
                  <div className="flex items-center justify-end gap-1">
                    {!passenger.pago && (
                      <Button variant="ghost" size="icon" onClick={() => handleMarkAsPaid('passenger', passenger.id)} className="hover:bg-green-100 hover:text-green-800">
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openLuggageModal(passenger)} className="hover:bg-primary/10 hover:text-primary">
                      <Briefcase className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPassenger(passenger); setIsPassengerModalOpen(true); }} className="hover:bg-primary/10 hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteItem({ type: 'passenger', item: passenger })} className="hover:bg-destructive/10 hover:text-destructive">
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
  );

  const PackageTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 print-clean">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="print-col-descricao">Descrição</TableHead>
            <TableHead className="print-col-remetente">Remetente / Destinatário</TableHead>
            <TableHead className="print-col-afiliado">Taxista / Comisseiro</TableHead>
            <TableHead className="print-col-valor">Valor</TableHead>
            <TableHead className="print-col-status">Status</TableHead>
            <TableHead className="text-right no-print">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Buscando dados...</TableCell></TableRow>
          ) : filteredPackages.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{packageSearchTerm ? 'Nenhuma encomenda encontrada' : 'Nenhuma encomenda nesta viagem (ou filtro)'}</TableCell></TableRow>
          ) : (
            filteredPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>{pkg.descricao}</TableCell>
                <TableCell>
                  <div className="text-xs"><b>De:</b> {pkg.remetente.nome}</div>
                  <div className="text-xs"><b>Para:</b> {pkg.destinatario.nome}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs"><b>T:</b> {pkg.taxista?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>C:</b> {pkg.comisseiro?.pessoa.nome || '-'}</div>
                </TableCell>
                <TableCell>{formatCurrency(pkg.valor)}</TableCell>
                <TableCell>
                  {pkg.pago ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                  )}
                </TableCell>
                <TableCell className="text-right no-print">
                  <div className="flex items-center justify-end gap-1">
                    {!pkg.pago && (
                      <Button variant="ghost" size="icon" onClick={() => handleMarkAsPaid('package', pkg.id)} className="hover:bg-green-100 hover:text-green-800">
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedPackage(pkg); setIsPackageModalOpen(true); }} className="hover:bg-primary/10 hover:text-primary">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteItem({ type: 'package', item: pkg })} className="hover:bg-destructive/10 hover:text-destructive">
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
  );
  
  // --- JSX Principal ---
  if (loading && !trip) { 
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
      {/* Botão de Voltar e Título (Não impressos) */}
      <div className="flex items-center gap-4 no-print">
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

      {/* Card de Informações (Será impresso limpo) */}
      <Card className="print-clean">
        <CardHeader>
          <CardTitle>Informações de viagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-muted-foreground">Data</p><p>{new Date(trip.dataHoraPartida).toLocaleDateString()}</p></div>
            <div><p className="text-muted-foreground">Partida</p><p>{new Date(trip.dataHoraPartida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-muted-foreground">Chegada</p><p>{new Date(trip.dataHoraChegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-muted-foreground">Ônibus</p><p>{trip.onibus.placa}</p></div>
            <div><p className="text-muted-foreground">Modelo</p><p>{trip.onibus.modelo}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* --- O <Tabs> INTEIRO AGORA É "no-print" --- */}
      <Tabs defaultValue="passengers" className="space-y-4 no-print">
        <TabsList>
          <TabsTrigger value="passengers">Passageiros ({passengers.length})</TabsTrigger>
          <TabsTrigger value="packages">Encomendas ({packages.length})</TabsTrigger>
        </TabsList>

        {/* --- ABA DE PASSAGEIROS (TELA) --- */}
        <TabsContent value="passengers" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={filterTaxistaId} onValueChange={(val) => { setFilterTaxistaId(val); setFilterComisseiroId('all'); }}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Taxista" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Taxistas</SelectItem>
                  {taxistas.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.pessoa.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterComisseiroId} onValueChange={(val) => { setFilterComisseiroId(val); setFilterTaxistaId('all'); }}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Comisseiro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Comisseiros</SelectItem>
                  {comisseiros.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.pessoa.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="text" placeholder="Pesquisar na lista..." value={passengerSearchTerm} onChange={(e) => setPassengerSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <CSVLink data={getPassengerCsvData()} filename={`passageiros_viagem_${tripId}.csv`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <FileDown className="w-4 h-4" />
              </CSVLink>
              <Button variant="outline" size="icon" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
              </Button>
              <Button onClick={() => { setSelectedPassenger(null); setIsPassengerModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Passageiro
              </Button>
            </div>
          </div>
          {/* Renderiza o sub-componente da tabela */}
          <PassengerTable />
        </TabsContent>

        {/* --- ABA DE ENCOMENDAS (TELA) --- */}
        <TabsContent value="packages" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={filterTaxistaId} onValueChange={(val) => { setFilterTaxistaId(val); setFilterComisseiroId('all'); }}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Taxista" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Taxistas</SelectItem>
                  {taxistas.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.pessoa.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterComisseiroId} onValueChange={(val) => { setFilterComisseiroId(val); setFilterTaxistaId('all'); }}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Comisseiro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Comisseiros</SelectItem>
                  {comisseiros.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.pessoa.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="text" placeholder="Pesquisar na lista..." value={packageSearchTerm} onChange={(e) => setPackageSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <CSVLink data={getPackageCsvData()} filename={`encomendas_viagem_${tripId}.csv`} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <FileDown className="w-4 h-4" />
              </CSVLink>
              <Button onClick={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Encomenda
              </Button>
            </div>
          </div>
          {/* Renderiza o sub-componente da tabela */}
          <PackageTable />
        </TabsContent>
      </Tabs>

      {/* --- DIV SOMENTE PARA IMPRESSÃO --- */}
      <div className="print-only space-y-6">
        <h3 className="print-title">Relatório de Passageiros</h3>
        <PassengerTable />
        
        <h3 className="print-title">Relatório de Encomendas</h3>
        <PackageTable />
      </div>

      {/* --- Modais (Não são impressos) --- */}
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
        title={`Excluir ${deleteItem?.type === 'passenger' ? 'Passageiro' : 'Encomenda'}`}
        description={`Tem certeza de que deseja excluir? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}