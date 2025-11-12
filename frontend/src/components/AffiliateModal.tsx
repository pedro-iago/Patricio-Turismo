import React, { useState, useEffect } from 'react';
// --- Imports removidos (Popover, Command, Check, etc.) ---

// --- IMPORTS NOVOS (do PassengerModal) ---
import { PessoaSearchCombobox } from './PessoaSearchCombobox';
import PersonModal from './PersonModal';
import api from '../services/api';

// --- Imports Originais ---
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';

// --- INTERFACES ADICIONADAS (para o novo modal de pessoa) ---
interface Person {
  id: number;
  nome: string;
  // ...outros campos que a API de pessoa retorna
}
interface PersonSaveDto {
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}
// --- FIM DAS NOVAS INTERFACES ---

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pessoaId: number) => void; // MUDADO para 'number'
  // peopleList: Person[]; // <-- REMOVIDO!
  affiliateType: 'taxista' | 'comisseiro';
}

export default function AffiliateModal({ isOpen, onClose, onSave, affiliateType }: AffiliateModalProps) {
  // MUDADO para number | null
  const [selectedPessoaId, setSelectedPessoaId] = useState<number | null>(null);
  
  // --- Novo Estado (para o modal interno) ---
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Reseta o formulário quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setSelectedPessoaId(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPessoaId) {
      alert("Por favor, selecione uma pessoa.");
      return;
    }
    onSave(selectedPessoaId);
  };

  // --- NOVA FUNÇÃO (para salvar a nova pessoa) ---
  const handleSaveNewPessoa = async (personDto: PersonSaveDto) => {
    try {
      const response = await api.post<Person>('/api/pessoa', personDto);
      const newPerson = response.data;
      // Define a pessoa recém-criada como a selecionada
      setSelectedPessoaId(newPerson.id);
      setIsPersonModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar nova pessoa:", error);
      alert("Erro ao criar pessoa.");
    }
  };

  const title = affiliateType === 'taxista' ? 'Novo Taxista' : 'Novo Comisseiro';
  const description = `Selecione uma pessoa da lista para cadastrá-la como ${affiliateType}.`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            
            {/* --- INÍCIO DA SUBSTITUIÇÃO --- */}
            {/* O <Popover> antigo foi substituído por este componente */}
            <div className="space-y-2">
              <Label htmlFor="pessoa">Pessoa (Obrigatório)</Label>
              <PessoaSearchCombobox
                value={selectedPessoaId}
                onSelect={(pessoaId) => setSelectedPessoaId(pessoaId)}
                onAddNew={() => setIsPersonModalOpen(true)}
                onClear={() => setSelectedPessoaId(null)}
              />
            </div>
            {/* --- FIM DA SUBSTITUIÇÃO --- */}

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL INTERNO ADICIONADO --- */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSaveNewPessoa}
        person={null} 
      />
    </>
  );
}