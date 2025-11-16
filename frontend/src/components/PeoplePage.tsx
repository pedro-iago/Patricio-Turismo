import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// ✅ 1. IMPORTE OS COMPONENTES DE CARD
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

// ... (Interfaces: Person, PersonDto, Page - SEM ALTERAÇÃO) ...
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
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ... (Lógica de fetch, handle, filter, etc. - SEM ALTERAÇÃO) ...
  const fetchPeople = async (page = 0) => {
    try {
      const response = await api.get<Page<Person>>(`/api/pessoa?page=${page}&size=10`);
      setPeople(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.number);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    }
  };

  useEffect(() => {
    fetchPeople(currentPage);
  }, [currentPage]);

  const handleCreatePerson = async (personData: PersonDto) => {
    try {
      await api.post('/api/pessoa', personData);
      setIsModalOpen(false);
      await fetchPeople(currentPage);
    } catch (error) {
      console.error("Erro ao criar pessoa:", error);
    }
  };

  const handleUpdatePerson = async (personData: PersonDto) => {
    if (!selectedPerson) return;
    try {
      await api.put(`/api/pessoa/${selectedPerson.id}`, personData);
      setSelectedPerson(null);
      setIsModalOpen(false);
      await fetchPeople(currentPage);
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error, selectedPerson);
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePerson) return;
    try {
      await api.delete(`/api/pessoa/${deletePerson.id}`);
      setDeletePerson(null);
      await fetchPeople(currentPage);
    } catch (error) {
      console.error("Erro ao deletar pessoa:", error, deletePerson);
    }
  };

  const openEditModal = (person: Person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  const filteredPeople = people.filter(person => {
    const searchLower = searchTerm.toLowerCase();
    return (
      person.nome.toLowerCase().includes(searchLower) ||
      person.cpf.toLowerCase().includes(searchLower) ||
      (person.telefone && person.telefone.toLowerCase().includes(searchLower))
    );
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
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

  return (
    <div className="space-y-6">
      {/* ... (Cabeçalho da página e Input de Busca - SEM ALTERAÇÃO) ... */}
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

      {/* ✅ 2. TABELA (VISÍVEL APENAS EM DESKTOP) */}
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
            {filteredPeople.map((person) => (
              <TableRow key={person.id}>
                <TableCell>{person.nome}</TableCell>
                <TableCell>{person.cpf}</TableCell>
                <TableCell>{person.telefone || '-'}</TableCell>
                <TableCell>{person.idade || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/pessoas/${person.id}`)}
                      className="hover:bg-primary/10 hover:text-primary"
                      title="Ver Histórico"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(person)}
                      className="hover:bg-primary/10 hover:text-primary"
                      title="Editar Pessoa"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletePerson(person)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir Pessoa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ✅ 3. LISTA DE CARDS (VISÍVEL APENAS EM MOBILE) */}
      <div className="block md:hidden space-y-4">
        {filteredPeople.map((person) => (
          <Card key={person.id} className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>{person.nome}</CardTitle>
              <CardDescription>CPF: {person.cpf}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Telefone: </span>
                {person.telefone || '-'}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Idade: </span>
                {person.idade || '-'}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/pessoas/${person.id}`)}
                className="hover:bg-primary/10 hover:text-primary"
                title="Ver Histórico"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditModal(person)}
                className="hover:bg-primary/10 hover:text-primary"
                title="Editar Pessoa"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletePerson(person)}
                className="hover:bg-destructive/10 hover:text-destructive"
                title="Excluir Pessoa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>


      {/* --- PAGINAÇÃO (SEM ALTERAÇÃO - Sempre visível) --- */}
      {totalPages > 1 && (
        <Pagination>
          {/* ... (Conteúdo da paginação sem alteração) ... */}
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                className={cn(currentPage === 0 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>
            {getPaginationItems(currentPage, totalPages).map((pageItem, index) => (
              <PaginationItem key={index}>
                {typeof pageItem === 'string' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={pageItem === currentPage}
                    onClick={(e) => { e.preventDefault(); handlePageChange(pageItem as number); }}
                  >
                    {(pageItem as number) + 1}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                className={cn(currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}


      {/* ... (Modais - SEM ALTERAÇÃO) ... */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPerson(null);
        }}
        onSave={selectedPerson ? handleUpdatePerson : handleCreatePerson}
        person={selectedPerson
      />
      <DeleteConfirmModal
        isOpen={!!deletePerson}
        onClose={() => setDeletePerson(null)}
        onConfirm={handleDeletePerson}
        title="Excluir Pessoa"
        description={`Tem certeza de que deseja excluir ${deletePerson?.nome}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}