import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
// ✅ ÍCONES IMPORTADOS
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AffiliateModal from './AffiliateModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
// ✅ IMPORTS DA PAGINAÇÃO (COM ELLIPSIS)
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationPrevious, 
  PaginationNext, 
  PaginationLink, 
  PaginationEllipsis // <-- ADICIONADO
} from './ui/pagination';
import { cn } from './ui/utils';


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

  // --- Funções de Busca ---
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
      // Ajustado para buscar mais pessoas para o combobox
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

  // --- Funções de Ação ---
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

  // --- LÓGICA DE FILTRO (no frontend) ---
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

  // --- HANDLERS DE PAGINAÇÃO (NOVOS) ---
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

  // --- FUNÇÃO HELPER DA PAGINAÇÃO (NOVA) ---
  const getPaginationItems = (currentPage: number, totalPages: number) => {
    const items: (number | string)[] = [];
    const maxPageNumbers = 5; // Máximo de números visíveis (ex: 1, ..., 5, 6, 7, ..., 10)
    const pageRangeDisplayed = 1; // Quantos números antes/depois do atual

    if (totalPages <= maxPageNumbers) {
      for (let i = 0; i < totalPages; i++) {
        items.push(i);
      }
    } else {
      // Sempre mostrar a primeira página
      items.push(0);

      // Elipse ou números no início
      if (currentPage > pageRangeDisplayed + 1) {
        items.push('...');
      } else if (currentPage === pageRangeDisplayed + 1) {
        items.push(1);
      }

      // Páginas ao redor da atual
      for (let i = Math.max(1, currentPage - pageRangeDisplayed); i <= Math.min(totalPages - 2, currentPage + pageRangeDisplayed); i++) {
        if (i !== 0) {
          items.push(i);
        }
      }

      // Elipse ou números no final
      if (currentPage < totalPages - pageRangeDisplayed - 2) {
        items.push('...');
      } else if (currentPage === totalPages - pageRangeDisplayed - 2) {
        items.push(totalPages - 2);
      }

      // Sempre mostrar a última página
      if (totalPages > 1) {
         items.push(totalPages - 1);
      }
    }
    
    // Remove duplicatas (caso a primeira/última página apareça na lógica do meio)
    return [...new Set(items)];
  };


  // --- Componente de Tabela Reutilizável ---
  const AffiliateTable = ({ data, type }: { data: Affiliate[]; type: AffiliateType }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                
                {/* BOTÃO DE DETALHES */}
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
  );


  return (
    <div className="space-y-6">
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
          <div className="flex justify-between items-center">
            <div className="relative w-1/2 sm:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou CPF..."
                value={taxistaSearchTerm}
                onChange={(e) => setTaxistaSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openCreateModal('taxista')} className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Novo Taxista
            </Button>
          </div>
          <AffiliateTable data={filteredTaxistas} type="taxista" />

          {/* --- PAGINAÇÃO ATUALIZADA (TAXISTAS) --- */}
          {taxistaTotalPages > 1 && (
            <Pagination>
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
          <div className="flex justify-between items-center">
            <div className="relative w-1/2 sm:w-1/3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por nome ou CPF..."
                value={comisseiroSearchTerm}
                onChange={(e) => setComisseiroSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => openCreateModal('comisseiro')} className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Novo Comisseiro
            </Button>
          </div>
          <AffiliateTable data={filteredComisseiros} type="comisseiro" />

          {/* --- PAGINAÇÃO ATUALIZADA (COMISSEIROS) --- */}
          {comisseiroTotalPages > 1 && (
            <Pagination>
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

      {/* --- Modais --- */}
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