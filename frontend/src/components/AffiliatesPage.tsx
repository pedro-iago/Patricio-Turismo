import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Search, Edit, Car, UserCheck, Phone, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AffiliateModal from './AffiliateModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from './ui/pagination';
import { cn } from './ui/utils';

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: AffiliateType } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [taxistaPage, setTaxistaPage] = useState(0);
  const [taxistaTotalPages, setTaxistaTotalPages] = useState(0);
  const [comisseiroPage, setComisseiroPage] = useState(0);
  const [comisseiroTotalPages, setComisseiroTotalPages] = useState(0);

  useEffect(() => {
    const delay = setTimeout(() => {
        if (currentAffiliateType === 'taxista') fetchTaxistas(0);
        else fetchComisseiros(0);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, currentAffiliateType]);

  const fetchTaxistas = async (page = 0) => {
    try {
      const response = await api.get<Page<Affiliate>>(`/api/v1/affiliates/taxistas?page=${page}&size=12&sort=pessoa.nome,asc&nome=${searchTerm}`);
      setTaxistas(response.data.content);
      setTaxistaTotalPages(response.data.totalPages);
      setTaxistaPage(response.data.number);
    } catch (error) { console.error(error); }
  };

  const fetchComisseiros = async (page = 0) => {
    try {
      const response = await api.get<Page<Affiliate>>(`/api/v1/affiliates/comisseiros?page=${page}&size=12&sort=pessoa.nome,asc&nome=${searchTerm}`);
      setComisseiros(response.data.content);
      setComisseiroTotalPages(response.data.totalPages);
      setComisseiroPage(response.data.number);
    } catch (error) { console.error(error); }
  };

  const fetchPeople = async () => {
    try { const response = await api.get<Person[]>('/api/pessoa?size=1000'); setPeopleList(response.data); } 
    catch (error) { console.error(error); }
  };

  const handleOpenModal = async (type: AffiliateType) => {
    await fetchPeople();
    setCurrentAffiliateType(type);
    setIsModalOpen(true);
  };

  const handleSaveAffiliate = async (pessoaId: number) => {
    try {
      if (currentAffiliateType === 'taxista') await api.post('/api/v1/affiliates/taxistas', { pessoaId });
      else await api.post('/api/v1/affiliates/comisseiros', { pessoaId });
      setIsModalOpen(false);
      currentAffiliateType === 'taxista' ? fetchTaxistas(0) : fetchComisseiros(0);
    } catch (error) { alert('Erro ao adicionar afiliado.'); }
  };

  const handleDeleteAffiliate = async () => {
    if (!deleteTarget) return;
    try {
      const url = deleteTarget.type === 'taxista' ? `/api/v1/affiliates/taxistas/${deleteTarget.id}` : `/api/v1/affiliates/comisseiros/${deleteTarget.id}`;
      await api.delete(url);
      setDeleteTarget(null);
      deleteTarget.type === 'taxista' ? fetchTaxistas(taxistaPage) : fetchComisseiros(comisseiroPage);
    } catch (error) { alert('Erro ao remover afiliado.'); }
  };

  const handlePageChange = (type: AffiliateType, page: number) => {
      if (type === 'taxista') { if (page >= 0 && page < taxistaTotalPages) fetchTaxistas(page); }
      else { if (page >= 0 && page < comisseiroTotalPages) fetchComisseiros(page); }
  };

  // Componente de Card Reutilizável
  const AffiliateCard = ({ item, type }: { item: Affiliate, type: AffiliateType }) => (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
        <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
                {/* COR PADRONIZADA: LARANJA */}
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    {type === 'taxista' ? <Car className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-bold text-slate-800 truncate" title={item.pessoa.nome}>
                        {item.pessoa.nome}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">ID: #{item.id}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-1">
            <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.pessoa.telefone || item.pessoa.telefones?.[0] || "Sem telefone"}</span>
            </div>
            {item.pessoa.cpf && (
                <div className="text-xs text-slate-400 pl-5.5">CPF: {item.pessoa.cpf}</div>
            )}
        </CardContent>
        <CardFooter className="flex justify-end gap-1 pt-0">
            {/* BOTÃO DE HISTÓRICO / REPORT */}
            <Button variant="ghost" size="icon" onClick={() => navigate(type === 'taxista' ? `/taxistas/${item.id}` : `/comisseiros/${item.id}`)} className="text-slate-400 hover:text-blue-600" title="Ver Histórico/Relatório">
                <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: item.id, type })} className="text-slate-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
            </Button>
        </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Afiliados</h2>
          <p className="text-muted-foreground">Parceiros de transporte e comissões.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
      </div>

      <Tabs defaultValue="taxista" onValueChange={(val) => setCurrentAffiliateType(val as AffiliateType)} className="space-y-4">
        <div className="flex items-center justify-between">
            <TabsList className="bg-white border">
                {/* COR PADRONIZADA NO ACTIVE STATE (via CSS ou className se customizado, mas o padrão shadcn é preto/branco. 
                    Se quiser laranja no active, precisaria alterar o theme ou class. Deixei padrão shadcn por enquanto) */}
                <TabsTrigger value="taxista" className="gap-2"><Car className="w-4 h-4" /> Taxistas</TabsTrigger>
                <TabsTrigger value="comisseiro" className="gap-2"><UserCheck className="w-4 h-4" /> Comisseiros</TabsTrigger>
            </TabsList>
            <Button onClick={() => handleOpenModal(currentAffiliateType)} className="bg-orange-600 hover:bg-orange-700 gap-2 text-white">
                <Plus className="w-4 h-4" /> Novo {currentAffiliateType === 'taxista' ? 'Taxista' : 'Comisseiro'}
            </Button>
        </div>

        <TabsContent value="taxista">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {taxistas.map(item => <AffiliateCard key={item.id} item={item} type="taxista" />)}
            </div>
            {taxistaTotalPages > 1 && (
                <div className="mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange('taxista', taxistaPage - 1); }} className={cn(taxistaPage === 0 && "opacity-50 pointer-events-none")} /></PaginationItem>
                            <div className="text-sm text-slate-500 px-4">Página {taxistaPage + 1} de {taxistaTotalPages}</div>
                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange('taxista', taxistaPage + 1); }} className={cn(taxistaPage >= taxistaTotalPages - 1 && "opacity-50 pointer-events-none")} /></PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </TabsContent>

        <TabsContent value="comisseiro">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {comisseiros.map(item => <AffiliateCard key={item.id} item={item} type="comisseiro" />)}
            </div>
            {comisseiroTotalPages > 1 && (
                <div className="mt-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange('comisseiro', comisseiroPage - 1); }} className={cn(comisseiroPage === 0 && "opacity-50 pointer-events-none")} /></PaginationItem>
                            <div className="text-sm text-slate-500 px-4">Página {comisseiroPage + 1} de {comisseiroTotalPages}</div>
                            <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange('comisseiro', comisseiroPage + 1); }} className={cn(comisseiroPage >= comisseiroTotalPages - 1 && "opacity-50 pointer-events-none")} /></PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </TabsContent>
      </Tabs>

      <AffiliateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAffiliate} peopleList={peopleList} affiliateType={currentAffiliateType} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteAffiliate} title={`Excluir ${deleteTarget?.type}`} description="Tem certeza?" />
    </div>
  );
}