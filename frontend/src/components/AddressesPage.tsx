import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import AddressModal from './AddressModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink, PaginationEllipsis } from './ui/pagination';
import { cn } from './ui/utils';

interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface AddressDto { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface Page<T> { content: T[]; totalPages: number; number: number; }

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const delay = setTimeout(() => fetchAddresses(0), 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchAddresses = async (page = 0) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '12');
      params.append('sort', 'cidade,asc');
      if (searchTerm) params.append('query', searchTerm);

      const response = await api.get<Page<Address>>(`/api/endereco?${params.toString()}`);
      setAddresses(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.number);
    } catch (error) { console.error(error); }
  };

  const handleCreateAddress = async (data: AddressDto) => { try { await api.post('/api/endereco', data); setIsModalOpen(false); fetchAddresses(0); } catch (e) { console.error(e); } };
  const handleUpdateAddress = async (data: AddressDto) => { if (!selectedAddress) return; try { await api.put(`/api/endereco/${selectedAddress.id}`, data); setIsModalOpen(false); setSelectedAddress(null); fetchAddresses(currentPage); } catch (e) { console.error(e); } };
  const handleDeleteAddress = async () => { if (!deleteAddress) return; try { await api.delete(`/api/endereco/${deleteAddress.id}`); setDeleteAddress(null); fetchAddresses(currentPage); } catch (e) { console.error(e); } };
  const handlePageChange = (page: number) => { if (page >= 0 && page < totalPages) fetchAddresses(page); };

  const getPaginationItems = (current: number, total: number) => {
    const items = [];
    if (total <= 5) { for(let i=0; i<total; i++) items.push(i); }
    else { items.push(0, current > 2 ? '...' : null, current, current < total-3 ? '...' : null, total-1); }
    return [...new Set(items.filter(i => i !== null))];
  };

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Endereços</h2>
          <p className="text-muted-foreground">Pontos de coleta e entrega.</p>
        </div>
        <Button onClick={() => { setSelectedAddress(null); setIsModalOpen(true); }} className="bg-orange-600 hover:bg-orange-700 gap-2 text-white">
          <Plus className="w-4 h-4" /> Novo Endereço
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar rua, bairro ou cidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {addresses.map((address) => (
          <Card key={address.id} className="hover:shadow-md transition-shadow border-slate-200 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        {/* COR PADRONIZADA: LARANJA */}
                        <MapPin className="w-4 h-4 text-orange-600" />
                        {address.cidade}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs bg-slate-50">{address.estado}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-1">
                <div className="font-medium text-slate-800">
                    {address.logradouro}, {address.numero}
                </div>
                <div>Bairro: {address.bairro}</div>
                {address.cep && <div className="text-xs text-slate-400">CEP: {address.cep}</div>}
            </CardContent>
            <CardFooter className="flex justify-end gap-1 pt-0">
              <Button variant="ghost" size="icon" onClick={() => { setSelectedAddress(address); setIsModalOpen(true); }} className="text-slate-400 hover:text-orange-600">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteAddress(address)} className="text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn(currentPage === 0 && "opacity-50 pointer-events-none")} /></PaginationItem>
            {getPaginationItems(currentPage, totalPages).map((p, i) => (
              <PaginationItem key={i}>{typeof p === 'string' ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={p === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(p as number); }}>{(p as number) + 1}</PaginationLink>}</PaginationItem>
            ))}
            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn(currentPage >= totalPages - 1 && "opacity-50 pointer-events-none")} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <AddressModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAddress(null); }} onSave={selectedAddress ? handleUpdateAddress : handleCreateAddress} address={selectedAddress} />
      <DeleteConfirmModal isOpen={!!deleteAddress} onClose={() => setDeleteAddress(null)} onConfirm={handleDeleteAddress} title="Excluir Endereço" description="Tem certeza?" />
    </div>
  );
}