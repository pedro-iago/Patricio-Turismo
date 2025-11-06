import React, { useState, useEffect } from 'react';
// Importa o ícone de Busca
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import PersonModal from './PersonModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api'; 
// Importa o Input
import { Input } from './ui/input'; 

interface Person {
  id: number; // Corrigido de idPessoa para id (como fizemos antes)
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number;
}

interface PersonDto {
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  
  // --- NOVO ESTADO PARA A BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPeople = async () => {
    try {
      // Usando a rota correta da API
      const response = await api.get('/pessoa'); 
      setPeople(response.data);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // --- Funções de CRUD (sem mudanças) ---
  const handleCreatePerson = async (personData: PersonDto) => {
    try {
      await api.post('/pessoa', personData);
      setIsModalOpen(false);
      await fetchPeople();
    } catch (error) {
      console.error("Erro ao criar pessoa:", error);
    }
  };

  const handleUpdatePerson = async (personData: PersonDto) => {
    if (!selectedPerson) return;
    try {
      await api.put(`/pessoa/${selectedPerson.id}`, personData);
      setSelectedPerson(null);
      setIsModalOpen(false);
      await fetchPeople(); 
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error, selectedPerson); 
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePerson) return;
    try {
      await api.delete(`/pessoa/${deletePerson.id}`);
      setDeletePerson(null);
      await fetchPeople(); 
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
  
  // --- LÓGICA DE FILTRO ---
  const filteredPeople = people.filter(person => {
    const searchLower = searchTerm.toLowerCase();
    return (
      person.nome.toLowerCase().includes(searchLower) ||
      person.cpf.toLowerCase().includes(searchLower) ||
      (person.telefone && person.telefone.toLowerCase().includes(searchLower))
    );
  });

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

      {/* --- BARRA DE BUSCA ADICIONADA --- */}
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
            {/* --- MUDANÇA: .map() usa filteredPeople --- */}
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
                      onClick={() => openEditModal(person)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletePerson(person)}
                      className="hover:bg-destructive/10 hover:text-destructive"
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

      {/* --- Modais (sem mudanças) --- */}
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