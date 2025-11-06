import React, { useState, useEffect } from 'react';
// ÍCONE DE BUSCA ADICIONADO
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
// INPUT ADICIONADO
import { Input } from './ui/input'; 
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

  // --- NOVOS ESTADOS PARA AS BUSCAS (UM PARA CADA ABA) ---
  const [taxistaSearchTerm, setTaxistaSearchTerm] = useState('');
  const [comisseiroSearchTerm, setComisseiroSearchTerm] = useState('');

  // --- Funções de Busca (sem mudanças) ---
  const fetchTaxistas = async () => { /* ... */ };
  const fetchComisseiros = async () => { /* ... */ };
  const fetchPeople = async () => { /* ... */ };

  useEffect(() => {
    fetchTaxistas();
    fetchComisseiros();
    fetchPeople();
  }, []);

  // --- Funções de Ação (sem mudanças) ---
  const handleSaveAffiliate = async (pessoaId: string) => { /* ... */ };
  const handleDeleteAffiliate = async () => { /* ... */ };
  const openCreateModal = (type: AffiliateType) => { /* ... */ };
  const openDeleteModal = (affiliate: Affiliate, type: AffiliateType) => { /* ... */ };

  // --- LÓGICA DE FILTRO (SEPARADA) ---
  const filteredTaxistas = taxistas.filter(affiliate => {
    const searchLower = taxistaSearchTerm.toLowerCase();
    return (
      affiliate.pessoa.nome.toLowerCase().includes(searchLower) ||
      affiliate.pessoa.cpf.toLowerCase().includes(searchLower) ||
      (affiliate.pessoa.telefone && affiliate.pessoa.telefone.toLowerCase().includes(searchLower))
    );
  });

  const filteredComisseiros = comisseiros.filter(affiliate => {
    const searchLower = comisseiroSearchTerm.toLowerCase();
    return (
      affiliate.pessoa.nome.toLowerCase().includes(searchLower) ||
      affiliate.pessoa.cpf.toLowerCase().includes(searchLower) ||
      (affiliate.pessoa.telefone && affiliate.pessoa.telefone.toLowerCase().includes(searchLower))
    );
  });

  // --- Componente de Tabela Reutilizável (agora usa 'data' filtrada) ---
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
          {/* O 'data' que chega aqui já está filtrado */}
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
          <div className="flex items-center justify-between gap-4">
            {/* BARRA DE BUSCA (TAXISTAS) */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar taxistas..."
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
          {/* Tabela agora usa 'filteredTaxistas' */}
          <AffiliateTable data={filteredTaxistas} type="taxista" />
        </TabsContent>

        {/* --- Aba de Comisseiros --- */}
        <TabsContent value="comisseiros" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* BARRA DE BUSCA (COMISSEIROS) */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar comisseiros..."
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
          {/* Tabela agora usa 'filteredComisseiros' */}
          <AffiliateTable data={filteredComisseiros} type="comisseiro" />
        </TabsContent>
      </Tabs>

      {/* --- Modais (sem mudanças) --- */}
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