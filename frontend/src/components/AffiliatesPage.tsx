import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. IMPORTADO O useNavigate
// ✅ ÍCONES IMPORTADOS (COM O 'Eye' ADICIONADO)
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AffiliateModal from './AffiliateModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from './ui/pagination';
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
  const navigate = useNavigate(); // 2. INICIALIZADO O navigate
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

  // --- Funções de Busca (Corrigidas) ---
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

  // --- Funções de Ação (Corrigidas) ---
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


  // --- Componente de Tabela Reutilizável (MODIFICADO) ---
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
                
                {/* 3. BOTÃO DE DETALHES ADICIONADO */}
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

          {/* --- PAGINAÇÃO CORRIGIDA --- */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setTaxistaPage(p => Math.max(0, p - 1)); }}
                  className={cn(
                    taxistaPage === 0 ? "pointer-events-none opacity-50" : "",
                    "[&>span]:hidden" // Esconde o texto "Previous"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => e.preventDefault()} className="font-medium text-muted-foreground">
                  Página {taxistaPage + 1} de {taxistaTotalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setTaxistaPage(p => Math.min(taxistaTotalPages - 1, p + 1)); }}
                  className={cn(
                    taxistaPage >= taxistaTotalPages - 1 ? "pointer-events-none opacity-50" : "",
                    "[&>span]:hidden" // Esconde o texto "Next"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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

          {/* --- PAGINAÇÃO CORRIGIDA --- */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setComisseiroPage(p => Math.max(0, p - 1)); }}
                  className={cn(
                    comisseiroPage === 0 ? "pointer-events-none opacity-50" : "",
                    "[&>span]:hidden" // Esconde o texto "Previous"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationPrevious>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" onClick={(e) => e.preventDefault()} className="font-medium text-muted-foreground">
                  Página {comisseiroPage + 1} de {comisseiroTotalPages}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setComisseiroPage(p => Math.min(comisseiroTotalPages - 1, p + 1)); }}
                  className={cn(
                    comisseiroPage >= comisseiroTotalPages - 1 ? "pointer-events-none opacity-50" : "",
                    "[&>span]:hidden" // Esconde o texto "Next"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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