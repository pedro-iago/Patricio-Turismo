import React, { useState, useEffect } from 'react'; // 1. Importar useEffect
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import AddressModal from './AddressModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api'; // 2. Importar API

// --- 3. Interface que combina com o Backend (Endereco.java) ---
interface Address {
  id: number;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// DTO para salvar (corresponde a EnderecoDto.java)
interface AddressDto {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// 4. Remover mockAddresses
// const mockAddresses: Address[] = [ ... ];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]); // 5. Começa vazio
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);

  // --- 6. Função para buscar dados da API ---
  const fetchAddresses = async () => {
    try {
      const response = await api.get('/endereco'); // Endpoint do EnderecoController
      setAddresses(response.data);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
  };

  // 7. useEffect para buscar dados ao carregar
  useEffect(() => {
    fetchAddresses();
  }, []);

  // --- 8. Funções do CRUD conectadas à API ---

  const handleCreateAddress = async (addressData: AddressDto) => {
    try {
      await api.post('/endereco', addressData);
      setIsModalOpen(false);
      await fetchAddresses(); // Recarrega a lista
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
      await fetchAddresses(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddress) return;
    try {
      await api.delete(`/endereco/${deleteAddress.id}`);
      setDeleteAddress(null);
      await fetchAddresses(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
    }
  };

  // --- Funções de abrir modais (sem mudança) ---
  const openEditModal = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  // 9. Helper para formatar o endereço principal na tabela
  const formatStreetAndNumber = (address: Address) => {
    return `${address.logradouro}, ${address.numero}`;
  };

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

      {/* --- 10. Tabela Corrigida --- */}
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
            {addresses.map((address) => (
              <TableRow key={address.id}>
                {/* Usa os nomes de campos corretos */}
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

      {/* --- 11. Modais (agora usam as funções de API) --- */}
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