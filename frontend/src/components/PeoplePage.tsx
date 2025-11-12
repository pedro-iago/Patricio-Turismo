import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORT ADICIONADO
// ✅ ÍCONES IMPORTADOS (Eye ADICIONADO)
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import PersonModal from './PersonModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { Input } from './ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from './ui/pagination';
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
  const navigate = useNavigate(); // <-- HOOK ADICIONADO
  const [people, setPeople] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                    
                    {/* --- BOTÃO DE HISTÓRICO ADICIONADO --- */}
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

      {/* --- PAGINAÇÃO --- */}
      <Pagination>
        <PaginationContent>
          <PaginationItem key="prev">
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
              className={cn(
                currentPage === 0 ? "pointer-events-none opacity-50" : "",
                "[&>span]:hidden"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationPrevious>
          </PaginationItem>
          
          <PaginationItem key="page">
             <PaginationLink href="#" onClick={(e) => e.preventDefault()} className="font-medium text-muted-foreground">
               Página {currentPage + 1} de {totalPages}
             </PaginationLink>
          </PaginationItem>
          
          <PaginationItem key="next">
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
              className={cn(
                currentPage >= totalPages - 1 ? "pointer-events-none opacity-50" : "",
                "[&>span]:hidden"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* --- MODAIS --- */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPerson(null);
        }}
        onSave={selectedPerson ? handleUpdatePerson : handleCreatePerson}
        person={selectedPerson}
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