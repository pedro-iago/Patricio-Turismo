import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AffiliateModal from './AffiliateModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from './ui/pagination';
import { cn } from './ui/utils';

// Atualizado para suportar lista de telefones
interface Person { id: number; nome: string; cpf: string; telefones?: string[]; telefone?: string; idade?: number; }
interface Affiliate { id: number; pessoa: Person; }
type AffiliateType = 'taxista' | 'comisseiro';
interface Page<T> { content: T[]; totalPages: number; number: number; }

export default function AffiliatesPage() {
  const navigate = useNavigate();
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [peopleList, setPeopleList] = useState<Person[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAffiliateType, setCurrentAffiliateType] = useState<AffiliateType>('taxista');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: AffiliateType; name: string } | null>(null);

  // Estados de Busca e Paginação
  const [taxistaSearchTerm, setTaxistaSearchTerm] = useState('');
  const [taxistaPage, setTaxistaPage] = useState(0);
  const [taxistaTotalPages, setTaxistaTotalPages] = useState(0);

  const [comisseiroSearchTerm, setComisseiroSearchTerm] = useState('');
  const [comisseiroPage, setComisseiroPage] = useState(0);
  const [comisseiroTotalPages, setComisseiroTotalPages] = useState(0);

  // --- FUNÇÕES DE BUSCA ---
  
  const fetchTaxistas = useCallback(async (page: number, term: string) => {
    try {
      const endpoint = term 
        ? `/api/v1/affiliates/taxistas/search?query=${term}&page=${page}&size=10`
        : `/api/v1/affiliates/taxistas?page=${page}&size=10`;
        
      const response = await api.get<Page<Affiliate>>(endpoint);
      setTaxistas(response.data.content || []); 
      setTaxistaTotalPages(response.data.totalPages || 0);
      // O backend retorna o número da página atual, atualizamos o estado para sincronizar
      if (response.data.number !== undefined) setTaxistaPage(response.data.number);
    } catch (error) { 
        console.error("Erro Taxistas:", error); 
        setTaxistas([]); 
    }
  }, []);

  const fetchComisseiros = useCallback(async (page: number, term: string) => {
    try {
      const endpoint = term 
        ? `/api/v1/affiliates/comisseiros/search?query=${term}&page=${page}&size=10`
        : `/api/v1/affiliates/comisseiros?page=${page}&size=10`;

      const response = await api.get<Page<Affiliate>>(endpoint);
      setComisseiros(response.data.content || []);
      setComisseiroTotalPages(response.data.totalPages || 0);
      if (response.data.number !== undefined) setComisseiroPage(response.data.number);
    } catch (error) { 
        console.error("Erro Comisseiros:", error); 
        setComisseiros([]); 
    }
  }, []);

  // --- EFEITOS DE DEBOUNCE ---
  // Quando o termo muda, reseta para página 0 e busca
  useEffect(() => {
    const delay = setTimeout(() => {
        fetchTaxistas(0, taxistaSearchTerm);
    }, 500);
    return () => clearTimeout(delay);
  }, [taxistaSearchTerm, fetchTaxistas]); // Removido taxistaPage da dependência para evitar loop

  useEffect(() => {
    const delay = setTimeout(() => {
        fetchComisseiros(0, comisseiroSearchTerm);
    }, 500);
    return () => clearTimeout(delay);
  }, [comisseiroSearchTerm, fetchComisseiros]);

  // --- EFEITO DE PAGINAÇÃO ---
  // Só dispara quando a página muda (e não é 0, pois o efeito de busca já cobre o 0)
  useEffect(() => {
      if (taxistaPage > 0) fetchTaxistas(taxistaPage, taxistaSearchTerm);
  }, [taxistaPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
      if (comisseiroPage > 0) fetchComisseiros(comisseiroPage, comisseiroSearchTerm);
  }, [comisseiroPage]); // eslint-disable-line react-hooks/exhaustive-deps


  const fetchPeople = async () => {
    try { const response = await api.get<Page<Person>>('/api/pessoa?page=0&size=100'); setPeopleList(response.data.content); } 
    catch (error) { console.error("Erro:", error); }
  };

  useEffect(() => { fetchPeople(); }, []);

  // --- HANDLERS ---

  const handlePageChange = (type: AffiliateType, newPage: number) => {
    if (type === 'taxista') {
        if (newPage >= 0 && newPage < taxistaTotalPages) setTaxistaPage(newPage);
    } else {
        if (newPage >= 0 && newPage < comisseiroTotalPages) setComisseiroPage(newPage);
    }
  };

  const handleSaveAffiliate = async (pessoaId: string) => {
    try {
      const payload = { pessoaId: parseInt(pessoaId, 10) };
      if (currentAffiliateType === 'taxista') { 
          await api.post('/api/v1/affiliates/taxistas', payload); 
          fetchTaxistas(0, taxistaSearchTerm); 
      } else { 
          await api.post('/api/v1/affiliates/comisseiros', payload); 
          fetchComisseiros(0, comisseiroSearchTerm); 
      }
      setIsModalOpen(false);
    } catch (error) { console.error("Erro:", error); }
  };

  const handleDeleteAffiliate = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'taxista') { 
          await api.delete(`/api/v1/affiliates/taxistas/${deleteTarget.id}`); 
          fetchTaxistas(taxistaPage, taxistaSearchTerm); 
      } else { 
          await api.delete(`/api/v1/affiliates/comisseiros/${deleteTarget.id}`); 
          fetchComisseiros(comisseiroPage, comisseiroSearchTerm); 
      }
      setDeleteTarget(null);
    } catch (error) { console.error("Erro:", error); }
  };

  const openCreateModal = (type: AffiliateType) => { setCurrentAffiliateType(type); setIsModalOpen(true); };
  const openDeleteModal = (affiliate: Affiliate, type: AffiliateType) => { setDeleteTarget({ id: affiliate.id, type: type, name: affiliate.pessoa.nome }); };

  // Helper para exibir telefones
  const formatPhones = (p: Person) => {
      if (p.telefones && p.telefones.length > 0) return p.telefones.join(' / ');
      return p.telefone || '-';
  };

  // Componente de Tabela Reutilizável
  const AffiliateTable = ({ data, type }: { data: Affiliate[]; type: AffiliateType }) => (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Telefone</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhum registro.</TableCell></TableRow> :
             data.map((affiliate) => (
              <TableRow key={affiliate.id}>
                <TableCell className="font-medium">{affiliate.pessoa.nome}</TableCell>
                <TableCell>{affiliate.pessoa.cpf}</TableCell>
                <TableCell>{formatPhones(affiliate.pessoa)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => navigate(type === 'taxista' ? `/taxistas/${affiliate.id}` : `/comisseiros/${affiliate.id}`)} className="hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteModal(affiliate, type)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="block md:hidden space-y-4">
        {data.map((affiliate) => (
          <Card key={affiliate.id} className="bg-white shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">{affiliate.pessoa.nome}</CardTitle>
                <CardDescription>CPF: {affiliate.pessoa.cpf}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm pb-2">
                <p><span className="font-medium text-muted-foreground">Telefone: </span>{formatPhones(affiliate.pessoa)}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-0">
              <Button variant="ghost" size="sm" onClick={() => navigate(type === 'taxista' ? `/taxistas/${affiliate.id}` : `/comisseiros/${affiliate.id}`)} className="text-primary"><Eye className="w-4 h-4 mr-1" /> Detalhes</Button>
              <Button variant="ghost" size="sm" onClick={() => openDeleteModal(affiliate, type)} className="text-destructive"><Trash2 className="w-4 h-4 mr-1" /> Excluir</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-semibold">Gestão de Afiliados</h2><p className="text-muted-foreground mt-1">Gerencie taxistas e comisseiros.</p></div>
      </div>

      <Tabs defaultValue="taxistas">
        <TabsList className="mb-4">
          <TabsTrigger value="taxistas">Taxistas</TabsTrigger>
          <TabsTrigger value="comisseiros">Comisseiros</TabsTrigger>
        </TabsList>

        <TabsContent value="taxistas" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Pesquisar taxista..." 
                value={taxistaSearchTerm} 
                onChange={(e) => {
                    setTaxistaSearchTerm(e.target.value);
                    // O debounce vai lidar com a busca, mas podemos resetar visualmente algo aqui se necessário
                }} 
                className="pl-10" 
              />
            </div>
            <Button onClick={() => openCreateModal('taxista')} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Novo Taxista</Button>
          </div>
          
          <AffiliateTable data={taxistas} type="taxista" />
          
          {taxistaTotalPages > 1 && (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handlePageChange('taxista', taxistaPage - 1); }} 
                            className={cn(taxistaPage === 0 && "pointer-events-none opacity-50")} 
                        />
                    </PaginationItem>
                    <div className="flex items-center text-sm text-muted-foreground mx-2">
                        Página {taxistaPage + 1} de {taxistaTotalPages}
                    </div>
                    <PaginationItem>
                        <PaginationNext 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handlePageChange('taxista', taxistaPage + 1); }} 
                            className={cn(taxistaPage >= taxistaTotalPages - 1 && "pointer-events-none opacity-50")} 
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="comisseiros" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Pesquisar comisseiro..." 
                value={comisseiroSearchTerm} 
                onChange={(e) => setComisseiroSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Button onClick={() => openCreateModal('comisseiro')} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Novo Comisseiro</Button>
          </div>
          
          <AffiliateTable data={comisseiros} type="comisseiro" />
          
          {comisseiroTotalPages > 1 && (
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handlePageChange('comisseiro', comisseiroPage - 1); }} 
                            className={cn(comisseiroPage === 0 && "pointer-events-none opacity-50")} 
                        />
                    </PaginationItem>
                    <div className="flex items-center text-sm text-muted-foreground mx-2">
                        Página {comisseiroPage + 1} de {comisseiroTotalPages}
                    </div>
                    <PaginationItem>
                        <PaginationNext 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); handlePageChange('comisseiro', comisseiroPage + 1); }} 
                            className={cn(comisseiroPage >= comisseiroTotalPages - 1 && "pointer-events-none opacity-50")} 
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>

      <AffiliateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAffiliate} peopleList={peopleList} affiliateType={currentAffiliateType} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteAffiliate} title={`Excluir ${deleteTarget?.type}`} description={`Tem certeza?`} />
    </div>
  );
}