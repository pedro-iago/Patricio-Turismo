import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import PersonModal from './PersonModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Person {
  id: number;
  name: string;
  document: string;
  phone: string;
  email?: string;
  type: 'client' | 'sender' | 'recipient';
}

const mockPeople: Person[] = [
  {
    id: 1,
    name: 'João Silva',
    document: '123.456.789-00',
    phone: '(11) 98765-4321',
    email: 'joao@email.com',
    type: 'client',
  },
  {
    id: 2,
    name: 'Maria Santos',
    document: '987.654.321-00',
    phone: '(21) 91234-5678',
    email: 'maria@email.com',
    type: 'client',
  },
  {
    id: 3,
    name: 'Tech Store SP',
    document: '12.345.678/0001-00',
    phone: '(11) 3456-7890',
    email: 'contact@techstore.com',
    type: 'sender',
  },
  {
    id: 4,
    name: 'Electronics RJ',
    document: '98.765.432/0001-00',
    phone: '(21) 3210-9876',
    email: 'info@electronics.com',
    type: 'recipient',
  },
];

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);

  const handleCreatePerson = (personData: Partial<Person>) => {
    const newPerson: Person = {
      id: Math.max(...people.map((p) => p.id), 0) + 1,
      ...personData as Person,
    };
    setPeople([...people, newPerson]);
    setIsModalOpen(false);
  };

  const handleUpdatePerson = (personData: Partial<Person>) => {
    if (selectedPerson) {
      setPeople(
        people.map((person) =>
          person.id === selectedPerson.id ? { ...person, ...personData } : person
        )
      );
      setSelectedPerson(null);
      setIsModalOpen(false);
    }
  };

  const handleDeletePerson = () => {
    if (deletePerson) {
      setPeople(people.filter((person) => person.id !== deletePerson.id));
      setDeletePerson(null);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'sender':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'recipient':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>People Management</h2>
          <p className="text-muted-foreground mt-1">Manage clients, senders, and recipients</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          New Person
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow key={person.id}>
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.document}</TableCell>
                <TableCell>{person.phone}</TableCell>
                <TableCell>{person.email || '-'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getTypeColor(person.type)}>
                    {person.type}
                  </Badge>
                </TableCell>
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
        title="Delete Person"
        description={`Are you sure you want to delete ${deletePerson?.name}? This action cannot be undone.`}
      />
    </div>
  );
}
