import React, { useState, useEffect } from 'react'; 
// Importa o Search e o Input
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import AddressModal from './AddressModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api'; 

interface Address {
  id: number;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface AddressDto {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);

  // --- NOVO ESTADO PARA A BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/endereco'); 
      setAddresses(response.data);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreateAddress = async (addressData: AddressDto) => {
    try {
      await api.post('/endereco', addressData);
      setIsModalOpen(false);
      await fetchAddresses(); 
    } catch (error) {
      console.error("Erro ao criar endereço:", error);
    }
  };

  const handleUpdateAddress = async (addressData: AddressDto) => {
    if (!selectedAddress) return;
    try {
      await api.put(`/endereco/${selectedAddress.id}`, addressData);
      setSelectedAddress(null);
      setIsModalOpen(false);
      await fetchAddresses(); 
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddress) return;
    try {
      await api.delete(`/endereco/${deleteAddress.id}`);
      setDeleteAddress(null);
      await fetchAddresses(); 
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
    }
  };

  // --- FUNÇÕES DO MODAL (CORRETAS) ---
  const openEditModal = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const formatStreetAndNumber = (address: Address) => {
    return `${address.logradouro}, ${address.numero}`;
  };

  // --- LÓGICA DE FILTRO ---
  const filteredAddresses = addresses.filter(address => {
    const searchLower = searchTerm.toLowerCase();
    return (
      address.logradouro.toLowerCase().includes(searchLower) ||
      address.bairro.toLowerCase().includes(searchLower) ||
      address.cidade.toLowerCase().includes(searchLower) ||
      address.cep.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Gerenciamento de endereços</h2>
          <p className="text-muted-foreground mt-1">Gerenciar endereços de coleta e entrega</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Novo Endereço
        </Button>
      </div>

      {/* --- BARRA DE BUSCA ADICIONADA --- */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar por rua, bairro, cidade ou CEP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rua e Número</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>CEP</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* --- MUDANÇA: .map() usa filteredAddresses --- */}
            {filteredAddresses.map((address) => (
              <TableRow key={address.id}>
                <TableCell>{formatStreetAndNumber(address)}</TableCell>
                <TableCell>{address.bairro}</TableCell>
                <TableCell>{address.cidade}</TableCell>
                <TableCell>{address.estado}</TableCell>
                <TableCell>{address.cep}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(address)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteAddress(address)}
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

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAddress(null);
        }}
        onSave={selectedAddress ? handleUpdateAddress : handleCreateAddress}
        address={selectedAddress}
      />

      <DeleteConfirmModal
        isOpen={!!deleteAddress}
        onClose={() => setDeleteAddress(null)}
        onConfirm={handleDeleteAddress}
        title="Excluir Endereço"
        description={`Tem certeza de que deseja excluir o endereço ${
          deleteAddress ? formatStreetAndNumber(deleteAddress) : ''
        }? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}