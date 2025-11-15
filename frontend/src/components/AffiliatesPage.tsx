import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// ✅ 1. IMPORTE OS COMPONENTES DE CARD
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
  PaginationLink,
  PaginationEllipsis
} from './ui/pagination';
import { cn } from './ui/utils';


// ... (Interfaces: Person, Affiliate, AffiliateType, Page - SEM ALTERAÇÃO) ...
interface Person {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number;
}

interface Affiliate {
  id: number;
  pessoa: Person;
}

type AffiliateType = 'taxista' | 'comisseiro';

interface Page<T> {
  content: T[];
  totalPages: number;
  number: number;
}


export default function AffiliatesPage() {
  const navigate = useNavigate();
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [peopleList, setPeopleList] = useState<Person[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAffiliateType, setCurrentAffiliateType] = useState<AffiliateType>('taxista');

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: AffiliateType; name: string } | null>(null);

  const [taxistaSearchTerm, setTaxistaSearchTerm] = useState('');
  const [comisseiroSearchTerm, setComisseiroSearchTerm] = useState('');

  const [taxistaPage, setTaxistaPage] = useState(0);
  const [taxistaTotalPages, setTaxistaTotalPages] = useState(0);
  const [comisseiroPage, setComisseiroPage] = useState(0);
  const [comisseiroTotalPages, setComisseiroTotalPages] = useState(0);

  // ... (Lógica de fetch, CRUD, filtros, etc. - SEM ALTERAÇÃO) ...
  const fetchTaxistas = async (page = 0) => {
    try {
      const response = await api.get<Page<Affiliate>>(`/api/v1/affiliates/taxistas?page=${page}&size=10`);
      setTaxistas(response.data.content);
      setTaxistaTotalPages(response.data.totalPages);
      setTaxistaPage(response.data.number);
    } catch (error) {
      console.error("Erro ao buscar taxistas:", error);
    }
  };

  const fetchComisseiros = async (page = 0) => {
    try {
      const response = await api.get<Page<Affiliate>>(`/api/v1/affiliates/comisseiros?page=${page}&size=10`);
      setComisseiros(response.data.content);
      setComisseiroTotalPages(response.data.totalPages);
      setComisseiroPage(response.data.number);
    } catch (error) {
      console.error("Erro ao buscar comisseiros:", error);
    }
  };

  const fetchPeople = async () => {
    try {
      const response = await api.get<Page<Person>>('/api/pessoa?page=0&size=100');
      setPeopleList(response.data.content);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    }
  };

  useEffect(() => {
    fetchTaxistas(taxistaPage);
  }, [taxistaPage]);

  useEffect(() => {
    fetchComisseiros(comisseiroPage);
  }, [comisseiroPage]);

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleSaveAffiliate = async (pessoaId: string) => {
    try {
      const payload = { pessoaId: parseInt(pessoaId, 10) };
      if (currentAffiliateType === 'taxista') {
        await api.post('/api/v1/affiliates/taxistas', payload);
        await fetchTaxistas(taxistaPage);
      } else {
        await api.post('/api/v1/affiliates/comisseiros', payload);
        await fetchComisseiros(comisseiroPage);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(`Erro ao criar ${currentAffiliateType}:`, error);
    }
  };

  const handleDeleteAffiliate = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'taxista') {
        await api.delete(`/api/v1/affiliates/taxistas/${deleteTarget.id}`);
        await fetchTaxistas(taxistaPage);
      } else {
        await api.delete(`/api/v1/affiliates/comisseiros/${deleteTarget.id}`);
        await fetchComisseiros(comisseiroPage);
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error(`Erro ao deletar ${deleteTarget.type}:`, error);
    }
  };

  const openCreateModal = (type: AffiliateType) => {
    setCurrentAffiliateType(type);
    setIsModalOpen(true);
  };

  const openDeleteModal = (affiliate: Affiliate, type: AffiliateType) => {
    setDeleteTarget({
      id: affiliate.id,
      type: type,
      name: affiliate.pessoa.nome
    });
  };

  const filterAffiliates = (affiliates: Affiliate[], searchTerm: string) => {
    if (!Array.isArray(affiliates)) return [];
    const searchLower = searchTerm.toLowerCase();
    return affiliates.filter(affiliate =>
      (affiliate.pessoa.nome && affiliate.pessoa.nome.toLowerCase().includes(searchLower)) ||
      (affiliate.pessoa.cpf && affiliate.pessoa.cpf.toLowerCase().includes(searchLower))
    );
  };

  const filteredTaxistas = filterAffiliates(taxistas, taxistaSearchTerm);
  const filteredComisseiros = filterAffiliates(comisseiros, comisseiroSearchTerm);

  const handleTaxistaPageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < taxistaTotalPages) {
      setTaxistaPage(newPage);
    }
  };

  const handleComisseiroPageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < comisseiroTotalPages) {
      setComisseiroPage(newPage);
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


  // ✅ 2. COMPONENTE DE TABELA ATUALIZADO (AGORA RESPONSIVO)
  const AffiliateTable = ({ data, type }: { data: Affiliate[]; type: AffiliateType }) => (
    <>
      {/* --- TABELA DESKTOP --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento (CPF)</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(data) && data.map((affiliate) => (
              <TableRow key={affiliate.id}>
                <TableCell>{affiliate.pessoa.nome}</TableCell>
                <TableCell>{affiliate.pessoa.cpf}</TableCell>
                <TableCell>{affiliate.pessoa.telefone || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const path = type === 'taxista' ? `/taxistas/${affiliate.id}` : `/comisseiros/${affiliate.id}`;
                      navigate(path);
                    }}
                    className="hover:bg-primary/10 hover:text-primary"
                    title="Ver Relatório"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteModal(affiliate, type)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir Afiliado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- CARDS MOBILE --- */}
      <div className="block md:hidden space-y-4">
        {Array.isArray(data) && data.map((affiliate) => (
          <Card key={affiliate.id} className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{affiliate.pessoa.nome}</CardTitle>
              <CardDescription>CPF: {affiliate.pessoa.cpf}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                <span className="font-medium text-muted-foreground">Telefone: </span>
                {affiliate.pessoa.telefone || '-'}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const path = type === 'taxista' ? `/taxistas/${affiliate.id}` : `/comisseiros/${affiliate.id}`;
                  navigate(path);
                }}
                className="hover:bg-primary/10 hover:text-primary"
                title="Ver Relatório"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteModal(affiliate, type)}
                className="hover:bg-destructive/10 hover:text-destructive"
                title="Excluir Afiliado"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );


  return (
    <div className="space-y-6">
      {/* ... (Cabeçalho da página - SEM ALTERAÇÃO) ... */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestão de Afiliados</h2>
          <p className="text-muted-foreground mt-1">Gerencie taxistas e comisseiros.</p>
        </div>
      </div>

      <Tabs defaultValue="taxistas">
        <TabsList className="mb-4">
          <TabsTrigger value="taxistas">Taxistas</TabsTrigger>
          <TabsTrigger value="comisseiros">Comisseiros</TabsTrigger>
        </TabsList>

        {/* --- Aba de Taxistas --- */}
        <TabsContent value="taxistas" className="space-y-4">
          {/* ✅ 3. LAYOUT DA BUSCA ATUALIZADO (Mobile-friendly) */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou CPF..."
                value={taxistaSearchTerm}
                onChange={(e) => setTaxistaSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openCreateModal('taxista')} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Novo Taxista
            </Button>
          </div>
          <AffiliateTable data={filteredTaxistas} type="taxista" />

          {/* --- PAGINAÇÃO (SEM ALTERAÇÃO - Sempre visível) --- */}
          {taxistaTotalPages > 1 && (
            <Pagination>
              {/* ... (Conteúdo da paginação sem alteração) ... */}
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleTaxistaPageChange(taxistaPage - 1); }}
                    className={cn(taxistaPage === 0 ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
                {getPaginationItems(taxistaPage, taxistaTotalPages).map((pageItem, index) => (
                  <PaginationItem key={index}>
                    {typeof pageItem === 'string' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={pageItem === taxistaPage}
                        onClick={(e) => { e.preventDefault(); handleTaxistaPageChange(pageItem as number); }}
                      >
                        {(pageItem as number) + 1}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleTaxistaPageChange(taxistaPage + 1); }}
                    className={cn(taxistaPage >= taxistaTotalPages - 1 ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        {/* --- Aba de Comisseiros --- */}
        <TabsContent value="comisseiros" className="space-y-4">
          {/* ✅ 3. LAYOUT DA BUSCA ATUALIZADO (Mobile-friendly) */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2">
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou CPF..."
                value={comisseiroSearchTerm}
                onChange={(e) => setComisseiroSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openCreateModal('comisseiro')} className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Novo Comisseiro
            </Button>
          </div>
          <AffiliateTable data={filteredComisseiros} type="comisseiro" />

          {/* --- PAGINAÇÃO (SEM ALTERAÇÃO - Sempre visível) --- */}
          {comisseiroTotalPages > 1 && (
            <Pagination>
              {/* ... (Conteúdo da paginação sem alteração) ... */}
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleComisseiroPageChange(comisseiroPage - 1); }}
                    className={cn(comisseiroPage === 0 ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
                {getPaginationItems(comisseiroPage, comisseiroTotalPages).map((pageItem, index) => (
                  <PaginationItem key={index}>
                    {typeof pageItem === 'string' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={pageItem === comisseiroPage}
                        onClick={(e) => { e.preventDefault(); handleComisseiroPageChange(pageItem as number); }}
                      >
                        {(pageItem as number) + 1}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleComisseiroPageChange(comisseiroPage + 1); }}
                    className={cn(comisseiroPage >= comisseiroTotalPages - 1 ? "pointer-events-none opacity-50" : "")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>

      {/* ... (Modais - SEM ALTERAÇÃO) ... */}
      <AffiliateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAffiliate}
        peopleList={peopleList}
        affiliateType={currentAffiliateType}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAffiliate}
        title={`Excluir ${deleteTarget?.type === 'taxista' ? 'Taxista' : 'Comisseiro'}`}
        description={`Tem certeza de que deseja remover ${deleteTarget?.name} como ${deleteTarget?.type}? Esta ação não afeta o cadastro da pessoa.`}
      />
    </div>
  );
}