import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, Phone } from 'lucide-react';

// DTO atualizado para array de strings
interface PersonDto {
  nome: string;
  cpf: string;
  telefones: string[]; // <--- MUDANÇA
  idade: number | null;
}

interface Person {
  id: number;
  nome: string;
  cpf: string;
  telefones: string[]; // <--- MUDANÇA
  idade: number | null;
}

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: PersonDto) => Promise<Person | null>; 
  person: Person | null;
}

export default function PersonModal({ isOpen, onClose, onSave, person }: PersonModalProps) {
  const [formData, setFormData] = useState<PersonDto>({
    nome: '',
    cpf: '',
    telefones: [''],
    idade: null,
  });

  useEffect(() => {
    if (person) {
      // Verificação de segurança para converter dados antigos se necessário
      let phonesData = [''];
      if (person.telefones && Array.isArray(person.telefones) && person.telefones.length > 0) {
        phonesData = person.telefones;
      } else if ((person as any).telefone) {
        // Fallback caso venha o campo antigo
        phonesData = [(person as any).telefone];
      }

      setFormData({
        nome: person.nome || '',
        cpf: person.cpf || '',
        telefones: phonesData,
        idade: person.idade || null,
      });
    } else {
      setFormData({ nome: '', cpf: '', telefones: [''], idade: null });
    }
  }, [person, isOpen]);

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...formData.telefones];
    newPhones[index] = value;
    setFormData({ ...formData, telefones: newPhones });
  };

  const addPhoneField = () => {
    setFormData({ ...formData, telefones: [...formData.telefones, ''] });
  };

  const removePhoneField = (index: number) => {
    const newPhones = formData.telefones.filter((_, i) => i !== index);
    if (newPhones.length === 0) newPhones.push('');
    setFormData({ ...formData, telefones: newPhones });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Limpa telefones vazios antes de salvar
    const cleanPhones = formData.telefones.filter(t => t.trim() !== '');
    await onSave({ ...formData, telefones: cleanPhones });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{person ? 'Editar Pessoa' : 'Nova Pessoa'}</DialogTitle>
          <DialogDescription>
            {person ? 'Atualize os detalhes.' : 'Insira as informações.'}
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
              />
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
          </div>
          
          <div className="space-y-2">
            <Label>Telefones</Label>
            {formData.telefones.map((tel, index) => (
              <div key={index} className="flex gap-2">
                 <div className="relative flex-1">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        value={tel}
                        onChange={(e) => handlePhoneChange(index, e.target.value)}
                        placeholder="(71) 99999-9999"
                    />
                 </div>
                 <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => removePhoneField(index)}
                    title="Remover telefone"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-1 w-full border-dashed" 
              onClick={addPhoneField}
            >
              <Plus className="h-3 w-3 mr-2" /> Adicionar outro telefone
            </Button>
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