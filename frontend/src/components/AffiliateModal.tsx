import React, { useState, useEffect } from 'react';
// --- Imports Adicionados ---
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from './ui/utils'; 
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'; 
// --- Imports Originais ---
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
// (O <Select> foi removido)

// Interface para uma Pessoa (baseada nos seus arquivos)
interface Person {
  id: number; 
  nome: string;
  cpf: string;
  telefone: string;
  idade?: number;
}

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pessoaId: string) => void; 
  peopleList: Person[]; // Recebe a lista de pessoas como prop
  affiliateType: 'taxista' | 'comisseiro';
}

export default function AffiliateModal({ isOpen, onClose, onSave, peopleList, affiliateType }: AffiliateModalProps) {
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | undefined>(undefined);
  
  // --- Novo Estado ---
  // Adicionamos um estado para controlar a abertura do Popover/Combobox
  const [openPopover, setOpenPopover] = useState(false);

  // Reseta o formulário quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setSelectedPessoaId(undefined);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPessoaId) {
      alert("Por favor, selecione uma pessoa."); // Você pode trocar por um <Sonner>
      return;
    }
    onSave(selectedPessoaId);
  };

  const title = affiliateType === 'taxista' ? 'Novo Taxista' : 'Novo Comisseiro';
  const description = `Selecione uma pessoa da lista para cadastrá-la como ${affiliateType}.`;

  // --- Novas Funções Auxiliares ---
  const getSelectedPersonName = () => {
    if (!selectedPessoaId) return null;
    return peopleList.find(p => p.id.toString() === selectedPessoaId)?.nome;
  };
  
  const getPlaceholder = () => {
    if (!Array.isArray(peopleList) || peopleList.length === 0) {
        return "Carregando pessoas...";
    }
    return "Selecione uma pessoa...";
  };

  return (
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
          {/* O <Select> antigo foi substituído por este <Popover> */}
          <div className="space-y-2">
            <Label htmlFor="pessoa">Pessoa</Label>
            <Popover open={openPopover} onOpenChange={setOpenPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPopover}
                  className="w-full justify-between font-normal"
                >
                  {selectedPessoaId ? getSelectedPersonName() : getPlaceholder()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar pessoa (nome ou CPF)..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                    <CommandGroup>
                      {Array.isArray(peopleList) && peopleList.filter(p => p && p.id).map((person) => (
                        <CommandItem
                          key={person.id}
                          // O 'value' permite pesquisar por nome ou CPF
                          value={`${person.nome} ${person.cpf}`}
                          onSelect={() => {
                            setSelectedPessoaId(person.id.toString());
                            setOpenPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPessoaId === person.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {person.nome} ({person.cpf})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
  );
}