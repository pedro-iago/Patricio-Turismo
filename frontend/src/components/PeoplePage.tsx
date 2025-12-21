import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, User, Phone, FileText, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import PersonModal from './PersonModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink, PaginationEllipsis } from './ui/pagination';
import { cn } from './ui/utils';

interface Person { id: number; nome: string; cpf: string; telefone: string; idade?: number; }
interface PersonDto { nome: string; cpf: string; telefone: string | null; idade?: number | null; }
interface Page<T> { content: T[]; totalPages: number; number: number; }

export default function PeoplePage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const delay = setTimeout(() => fetchPeople(0), 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchPeople = async (page = 0) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '12');
      params.append('sort', 'nome,asc');
      if (searchTerm) params.append('nome', searchTerm);

      const response = await api.get<Page<Person>>(`/api/pessoa?${params.toString()}`);
      setPeople(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.number);
    } catch (error) { console.error('Erro ao buscar pessoas:', error); }
  };

  const handleCreatePerson = async (data: PersonDto) => { try { await api.post('/api/pessoa', data); setIsModalOpen(false); fetchPeople(0); } catch (e) { console.error(e); } };
  const handleUpdatePerson = async (data: PersonDto) => { if (!selectedPerson) return; try { await api.put(`/api/pessoa/${selectedPerson.id}`, data); setIsModalOpen(false); setSelectedPerson(null); fetchPeople(currentPage); } catch (e) { console.error(e); } };
  const handleDeletePerson = async () => { if (!deletePerson) return; try { await api.delete(`/api/pessoa/${deletePerson.id}`); setDeletePerson(null); fetchPeople(currentPage); } catch (e) { console.error(e); } };
  const handlePageChange = (page: number) => { if (page >= 0 && page < totalPages) fetchPeople(page); };

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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pessoas</h2>
          <p className="text-muted-foreground">Cadastro de clientes e funcionários.</p>
        </div>
        <Button onClick={() => { setSelectedPerson(null); setIsModalOpen(true); }} className="bg-orange-600 hover:bg-orange-700 gap-2 text-white">
          <Plus className="w-4 h-4" /> Nova Pessoa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Pesquisar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {people.map((person) => (
          <Card key={person.id} className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {/* COR PADRONIZADA: LARANJA */}
                <div className="p-2 bg-orange-50 text-orange-600 rounded-full">
                    <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <CardTitle className="text-base font-bold text-slate-800 truncate" title={person.nome}>{person.nome}</CardTitle>
                    {person.idade && <p className="text-xs text-muted-foreground">{person.idade} anos</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{person.telefone || "Sem telefone"}</span>
                </div>
                {person.cpf && (
                    <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{person.cpf}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end gap-1 pt-0">
                {/* BOTÃO DE VISUALIZAR HISTÓRICO (AGORA COM OLHO) */}
                <Button variant="ghost" size="icon" onClick={() => navigate(`/pessoas/${person.id}`)} className="text-slate-400 hover:text-blue-600" title="Ver Histórico">
                    <Eye className="w-4 h-4" />
                </Button>
                {/* BOTÃO DE EDITAR CADASTRO */}
                <Button variant="ghost" size="icon" onClick={() => { setSelectedPerson(person); setIsModalOpen(true); }} className="text-slate-400 hover:text-orange-600" title="Editar Dados">
                    <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeletePerson(person)} className="text-slate-400 hover:text-red-600">
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

      <PersonModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedPerson(null); }} onSave={selectedPerson ? handleUpdatePerson : handleCreatePerson} person={selectedPerson} />
      <DeleteConfirmModal isOpen={!!deletePerson} onClose={() => setDeletePerson(null)} onConfirm={handleDeletePerson} title="Excluir Pessoa" description={`Tem certeza?`} />
    </div>
  );
}