import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
// import { Badge } from './ui/badge'; 
import PersonModal from './PersonModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api'; 

// --- 1. MUDANÇA AQUI: Interface agora usa 'idPessoa' ---
interface Person {
  idPessoa: number; // MUDADO DE 'id' PARA 'idPessoa'
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

  const fetchPeople = async () => {
    try {
      const response = await api.get('/pessoa'); 
      setPeople(response.data);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // --- Funções do CRUD ---

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
      // --- 2. MUDANÇA AQUI: URL agora usa 'idPessoa' ---
      await api.put(`/pessoa/${selectedPerson.idPessoa}`, personData);
      setSelectedPerson(null);
      setIsModalOpen(false);
      await fetchPeople(); 
    } catch (error) {
      console.error("Erro ao atualizar pessoa:", error, selectedPerson); // Adicionado log
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePerson) return;
    try {
      // --- 3. MUDANÇA AQUI: URL agora usa 'idPessoa' ---
      await api.delete(`/pessoa/${deletePerson.idPessoa}`);
      setDeletePerson(null);
      await fetchPeople(); 
    } catch (error) {
      console.error("Erro ao deletar pessoa:", error, deletePerson); // Adicionado log
    }
  };

  // --- Funções de abrir modais (sem mudança) ---
  const openEditModal = (person: Person) => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            {/* Corrigido o aviso de whitespace (DOM nesting) */}
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento (CPF)</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Idade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              // --- 4. MUDANÇA AQUI: 'key' agora usa 'idPessoa' ---
              <TableRow key={person.idPessoa}>
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