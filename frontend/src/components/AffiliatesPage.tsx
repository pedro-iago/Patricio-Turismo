import React, { useState, useEffect } from 'react';
// Importa o Search e o Input
import { Plus, Trash2, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AffiliateModal from './AffiliateModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api'; 

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

export default function AffiliatesPage() {
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [peopleList, setPeopleList] = useState<Person[]>([]); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAffiliateType, setCurrentAffiliateType] = useState<AffiliateType>('taxista');
  
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: AffiliateType; name: string } | null>(null);

  // --- NOVOS ESTADOS PARA AS BUSCAS ---
  const [taxistaSearchTerm, setTaxistaSearchTerm] = useState('');
  const [comisseiroSearchTerm, setComisseiroSearchTerm] = useState('');


  // --- Funções de Busca ---
  const fetchTaxistas = async () => {
    try {
      const response = await api.get('/api/v1/affiliates/taxistas'); 
      setTaxistas(response.data);
    } catch (error) {
      console.error("Erro ao buscar taxistas:", error);
    }
  };
  
  const fetchComisseiros = async () => {
    try {
      const response = await api.get('/api/v1/affiliates/comisseiros'); 
      setComisseiros(response.data);
    } catch (error) {
      console.error("Erro ao buscar comisseiros:", error);
    }
  };

  const fetchPeople = async () => {
    try {
      const response = await api.get('/pessoa'); 
      setPeopleList(response.data);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    }
  };

  useEffect(() => {
    fetchTaxistas();
    fetchComisseiros();
    fetchPeople();
  }, []);

  // --- Funções de Ação (Salvar/Deletar) ---
  const handleSaveAffiliate = async (pessoaId: string) => {
    try {
      const payload = { pessoaId: parseInt(pessoaId, 10) };
      
      if (currentAffiliateType === 'taxista') {
        await api.post('/api/v1/affiliates/taxistas', payload);
        await fetchTaxistas(); 
      } else {
        await api.post('/api/v1/affiliates/comisseiros', payload);
        await fetchComisseiros(); 
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
        await fetchTaxistas(); 
      } else {
        await api.delete(`/api/v1/affiliates/comisseiros/${deleteTarget.id}`);
        await fetchComisseiros(); 
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error(`Erro ao deletar ${deleteTarget.type}:`, error);
    }
  };

  // --- FUNÇÕES DO MODAL (CORRETAS) ---
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

  // --- LÓGICA DE FILTRO ---
  const filterAffiliates = (affiliates: Affiliate[], searchTerm: string) => {
    if (!Array.isArray(affiliates)) return []; // Garante que é um array
    const searchLower = searchTerm.toLowerCase();
    return affiliates.filter(affiliate => 
      (affiliate.pessoa.nome && affiliate.pessoa.nome.toLowerCase().includes(searchLower)) ||
      (affiliate.pessoa.cpf && affiliate.pessoa.cpf.toLowerCase().includes(searchLower))
    );
  };

  const filteredTaxistas = filterAffiliates(taxistas, taxistaSearchTerm);
  const filteredComisseiros = filterAffiliates(comisseiros, comisseiroSearchTerm);


  // Componente de Tabela Reutilizável
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteModal(affiliate, type)}
                  className="hover:bg-destructive/10 hover:text-destructive"
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
            {/* --- BARRA DE BUSCA (TAXISTAS) --- */}
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
          {/* --- MUDANÇA: Passa os dados filtrados --- */}
          <AffiliateTable data={filteredTaxistas} type="taxista" />
        </TabsContent>

        {/* --- Aba de Comisseiros --- */}
        <TabsContent value="comisseiros" className="space-y-4">
          <div className="flex justify-between items-center">
            {/* --- BARRA DE BUSCA (COMISSEIROS) --- */}
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
          {/* --- MUDANÇA: Passa os dados filtrados --- */}
          <AffiliateTable data={filteredComisseiros} type="comisseiro" />
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