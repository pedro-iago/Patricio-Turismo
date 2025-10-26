import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// --- Interfaces que combinam com o Backend ---
// DTO para salvar (corresponde a PessoaDto.java)
interface PersonDto {
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number; // idade é opcional
}

// Objeto Pessoa completo (corresponde a Pessoa.java)
interface Person {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number;
}

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: PersonDto) => void; // Envia o DTO correto
  person: Person | null; // Recebe a Pessoa correta
}

export default function PersonModal({ isOpen, onClose, onSave, person }: PersonModalProps) {
  // --- 1. Estado do formulário agora espelha o DTO ---
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    idade: '', // Formulários usam string
  });

  // 2. Efeito para popular o formulário
  useEffect(() => {
    if (person) {
      // Modo Edição
      setFormData({
        nome: person.nome || '',
        cpf: person.cpf || '',
        telefone: person.telefone || '',
        idade: person.idade?.toString() || '', // Converte número para string
      });
    } else {
      // Modo Criar
      setFormData({
        nome: '',
        cpf: '',
        telefone: '',
        idade: '',
      });
    }
  }, [person, isOpen]);

  // 3. handleSubmit envia o DTO formatado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome: formData.nome,
      cpf: formData.cpf,
      telefone: formData.telefone,
      // Converte a idade de volta para número, ou 'undefined' se estiver vazia
      idade: formData.idade ? parseInt(formData.idade, 10) : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{person ? 'Editar pessoa' : 'Nova pessoa'}</DialogTitle>
          <DialogDescription>
            {person ? 'Atualize as informações da pessoa abaixo.' : 'Insira informações para registrar uma nova pessoa.'}
          </DialogDescription>
        </DialogHeader>
        {/* --- 4. Formulário Corrigido --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">Documento (CPF)</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
            </div>
            
            {/* Campo 'Type' REMOVIDO */}
            
            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                type="number"
                value={formData.idade}
                onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Campo 'Email' REMOVIDO */}

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