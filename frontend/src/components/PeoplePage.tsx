import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import PersonModal from './PersonModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Input } from './ui/input';
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

interface Person {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number;
}

interface PersonDto {
  nome: string;
  cpf: string;
  telefone: string | null;
  idade?: number | null;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  number: number;
}

export default function PeoplePage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  
  // Busca e Paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- BUSCA NO SERVIDOR (Debounce) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Sempre que o termo mudar, voltamos para a página 0 e buscamos
      fetchPeople(0, searchTerm);
    }, 500); // Espera 500ms após parar de digitar

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchPeople = async (page = 0, term = '') => {
    setLoading(true);
    try {
      let response;
      
      if (term) {
        // Se tiver busca, usa o endpoint de pesquisa
        // NOTA: Se o seu endpoint /search retornar uma Lista simples (não paginada), 
        // tratamos como página única.
        response = await api.get<Person[] | Page<Person>>(`/api/pessoa/search?query=${term}`);
        
        if (Array.isArray(response.data)) {
            // Se o backend retornar array direto na busca
            setPeople(response.data);
            setTotalPages(1); 
            setCurrentPage(0);
        } else {
            // Se o backend retornar objeto Page na busca
            setPeople(response.data.content);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.number);
        }
      } else {
        // Se não tiver busca, usa a paginação padrão
        response = await api.get<Page<Person>>(`/api/pessoa?page=${page}&size=10`);
        setPeople(response.data.content);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.number);
      }
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
      setPeople([]);
    } finally {
        setLoading(false);
    }
  };

  // Quando muda a página via clique nos botões
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchPeople(newPage, searchTerm);
    }
  };

  // ... (CRUD Handlers mantidos) ...
  const handleCreatePerson = async (personData: PersonDto) => {
    try { await api.post('/api/pessoa', personData); setIsModalOpen(false); fetchPeople(0, searchTerm); } 
    catch (error) { console.error("Erro:", error); }
  };

  const handleUpdatePerson = async (personData: PersonDto) => {
    if (!selectedPerson) return;
    try { await api.put(`/api/pessoa/${selectedPerson.id}`, personData); setSelectedPerson(null); setIsModalOpen(false); fetchPeople(currentPage, searchTerm); } 
    catch (error) { console.error("Erro:", error); }
  };

  const handleDeletePerson = async () => {
    if (!deletePerson) return;
    try { await api.delete(`/api/pessoa/${deletePerson.id}`); setDeletePerson(null); fetchPeople(currentPage, searchTerm); } 
    catch (error) { console.error("Erro:", error); }
  };

  const openEditModal = (person: Person) => { setSelectedPerson(person); setIsModalOpen(true); };
  const openCreateModal = () => { setSelectedPerson(null); setIsModalOpen(true); };

  const getPaginationItems = (currentPage: number, totalPages: number) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h2>Gestão de Pessoas</h2>
          <p className="text-muted-foreground mt-1">Gerencie todas as pessoas cadastradas</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Nova pessoa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar por nome, CPF ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* TABELA DESKTOP */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento (CPF)</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow>
            ) : people.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
            ) : (
              people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>{person.nome}</TableCell>
                  <TableCell>{person.cpf}</TableCell>
                  <TableCell>{person.telefone || '-'}</TableCell>
                  <TableCell>{person.idade || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/pessoas/${person.id}`)} className="hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(person)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletePerson(person)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* LISTA MOBILE */}
      <div className="block md:hidden space-y-4">
        {loading ? <div className="text-center p-4">Carregando...</div> : 
         people.length === 0 ? <div className="text-center p-4 text-muted-foreground">Nenhum registro encontrado.</div> :
         people.map((person) => (
          <Card key={person.id} className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{person.nome}</CardTitle>
              <CardDescription>CPF: {person.cpf}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium text-muted-foreground">Telefone: </span>{person.telefone || '-'}</div>
              <div><span className="font-medium text-muted-foreground">Idade: </span>{person.idade || '-'}</div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/pessoas/${person.id}`)} className="hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => openEditModal(person)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeletePerson(person)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} className={cn(currentPage === 0 ? "pointer-events-none opacity-50" : "")} />
            </PaginationItem>
            {getPaginationItems(currentPage, totalPages).map((pageItem, index) => (
              <PaginationItem key={index}>
                {typeof pageItem === 'string' ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={pageItem === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(pageItem as number); }}>{(pageItem as number) + 1}</PaginationLink>}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} className={cn(currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "")} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <PersonModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedPerson(null); }} onSave={selectedPerson ? handleUpdatePerson : handleCreatePerson} person={selectedPerson} />
      <DeleteConfirmModal isOpen={!!deletePerson} onClose={() => setDeletePerson(null)} onConfirm={handleDeletePerson} title="Excluir Pessoa" description={`Tem certeza de que deseja excluir ${deletePerson?.nome}?`} />
    </div>
  );
}