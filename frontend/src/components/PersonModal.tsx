import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// Interface para o DTO de Pessoa
interface PersonDto {
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}

// Interface para a Pessoa completa (com ID)
interface Person {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Retorna o DTO salvo (que agora tem um ID)
  onSave: (person: PersonDto) => Promise<Person | null>; 
  person: Person | null; // Para edição
}

export default function PersonModal({ isOpen, onClose, onSave, person }: PersonModalProps) {
  const [formData, setFormData] = useState<PersonDto>({
    nome: '',
    cpf: '',
    telefone: '',
    idade: null,
  });

  useEffect(() => {
    if (person) {
      setFormData({
        nome: person.nome || '',
        cpf: person.cpf || '',
        telefone: person.telefone || '',
        idade: person.idade || null,
      });
    } else {
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        idade: null,
      });
    }
  }, [person, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData); // Chama a função onSave
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{person ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
          <DialogDescription>
            {person ? 'Atualize os detalhes da pessoa.' : 'Insira as informações da nova pessoa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: João da Silva"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(71) 99999-9999"
              />
            </div>
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                type="number"
                value={formData.idade || ''}
                onChange={(e) => setFormData({ ...formData, idade: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Ex: 30"
              />
            </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {person ? 'Atualizar' : 'Criar'} Pessoa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}