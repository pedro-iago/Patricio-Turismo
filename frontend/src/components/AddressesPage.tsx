import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// ✅ 1. IMPORTE OS COMPONENTES DE CARD
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import AddressModal from './AddressModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis
} from './ui/pagination';
import { cn } from './ui/utils';

// ... (Interfaces: Address, AddressDto, Page - SEM ALTERAÇÃO) ...
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
interface Page<T> {
  content: T[];
  totalPages: number;
  number: number;
}


export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ... (Lógica de fetch, CRUD, etc. - SEM ALTERAÇÃO) ...
  const fetchAddresses = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      const response = await api.get<Page<Address>>(`/api/endereco?page=${page}&size=10&sort=logradouro,asc`);
      setAddresses(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.number);
    } catch (error) {
      console.error("Erro ao buscar endereços:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses(currentPage);
  }, [currentPage, fetchAddresses]);

  const handleCreateAddress = async (addressData: AddressDto) => {
    try {
      await api.post('/api/endereco', addressData);
      setIsModalOpen(false);
      await fetchAddresses(0); // Volta para a primeira página
    } catch (error) {
      console.error("Erro ao criar endereço:", error);
    }
  };

  const handleUpdateAddress = async (addressData: AddressDto) => {
    if (!selectedAddress) return;
    try {
      await api.put(`/api/endereco/${selectedAddress.id}`, addressData);
      setSelectedAddress(null);
      setIsModalOpen(false);
      await fetchAddresses(currentPage); // Recarrega a página atual
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteAddress) return;
    try {
      await api.delete(`/api/endereco/${deleteAddress.id}`);
      setDeleteAddress(null);
      await fetchAddresses(currentPage); // Recarrega a página atual
    } catch (error) {
      console.error("Erro ao deletar endereço:", error);
    }
  };

  const openEditModal = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const formatStreetAndNumber = (address: Address) => {
    if (!address) return '';
    return `${address.logradouro}, ${address.numero}`;
  };

  const filteredAddresses = addresses.filter(address => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (address.logradouro && address.logradouro.toLowerCase().includes(searchLower)) ||
      (address.bairro && address.bairro.toLowerCase().includes(searchLower)) ||
      (address.cidade && address.cidade.toLowerCase().includes(searchLower)) ||
      (address.cep && address.cep.toLowerCase().includes(searchLower))
    );
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPaginationItems = (currentPage: number, totalPages: number) => {
    // ... (lógica da paginação - SEM ALTERAÇÃO) ...
    const items: (number | string)[] = [];
    const maxPageNumbers = 5;
    const pageRangeDisplayed = 1;
    if (totalPages <= maxPageNumbers) { for (let i = 0; i < totalPages; i++) { items.push(i); } }
    else { items.push(0); if (currentPage > pageRangeDisplayed + 1) { items.push('...'); }
    else if (currentPage === pageRangeDisplayed + 1) { items.push(1); }
    for (let i = Math.max(1, currentPage - pageRangeDisplayed); i <= Math.min(totalPages - 2, currentPage + pageRangeDisplayed); i++) { if (i !== 0) { items.push(i); } }
    if (currentPage < totalPages - pageRangeDisplayed - 2) { items.push('...'); }
    else if (currentPage === totalPages - pageRangeDisplayed - 2) { items.push(totalPages - 2); }
    if (totalPages > 1) { items.push(totalPages - 1); } }
    return [...new Set(items)];
  };

  return (
    <div className="space-y-6">
      {/* ... (Cabeçalho da página e Input de Busca - SEM ALTERAÇÃO) ... */}
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

      {/* ✅ 2. TABELA (VISÍVEL APENAS EM DESKTOP) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell>
              </TableRow>
            ) : (
              filteredAddresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell>{formatStreetAndNumber(address)}</TableCell>
                  <TableCell>{address.bairro || '-'}</TableCell>
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
              ))
            )}
            {!loading && filteredAddresses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Nenhum endereço encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ 3. LISTA DE CARDS (VISÍVEL APENAS EM MOBILE) */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground p-4">Carregando...</div>
        ) : filteredAddresses.length > 0 ? (
          filteredAddresses.map((address) => (
            <Card key={address.id} className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>{formatStreetAndNumber(address)}</CardTitle>
                <CardDescription>Bairro: {address.bairro || '-'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Cidade/Estado: </span>
                  {address.cidade} - {address.estado}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">CEP: </span>
                  {address.cep}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
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
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground p-4">Nenhum endereço encontrado.</div>
        )}
      </div>


      {/* --- PAGINAÇÃO (SEM ALTERAÇÃO - Sempre visível) --- */}
      {totalPages > 1 && (
        <Pagination>
          {/* ... (Conteúdo da paginação sem alteração) ... */}
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                className={cn(currentPage === 0 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>
            {getPaginationItems(currentPage, totalPages).map((pageItem, index) => (
              <PaginationItem key={index}>
                {typeof pageItem === 'string' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={pageItem === currentPage}
                    onClick={(e) => { e.preventDefault(); handlePageChange(pageItem as number); }}
                  >
                    {(pageItem as number) + 1}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                className={cn(currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}


      {/* ... (Modais - SEM ALTERAÇÃO) ... */}
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
        description={`Tem certeza de que deseja excluir o endereço ${deleteAddress ? formatStreetAndNumber(deleteAddress) : ''
          }? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}