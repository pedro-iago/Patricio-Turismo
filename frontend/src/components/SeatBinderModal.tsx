import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { User, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from './ui/utils';

// --- Imports do Combobox ---
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

// Definição simples do passageiro
interface Passenger {
  id: number;
  pessoa: {
    nome: string;
    cpf: string;
  };
}

interface SeatBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBind: (passengerId: number, seatId: number) => void;
  availablePassengers: Passenger[]; 
  seatId: number | null;            
  seatNumber: string;               
}

export default function SeatBinderModal({
  isOpen,
  onClose,
  onBind,
  availablePassengers,
  seatId,
  seatNumber
}: SeatBinderModalProps) {
  
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>('');
  const [open, setOpen] = useState(false); // Estado para abrir/fechar o popover

  // Limpa a seleção ao abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedPassengerId('');
      setOpen(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedPassengerId) {
      alert("Por favor, selecione um passageiro.");
      return;
    }
    if (seatId === null) {
      alert("Erro: ID do assento inválido.");
      return;
    }
    onBind(parseInt(selectedPassengerId), seatId);
  };

  // Helper para mostrar o nome selecionado no botão
  const getSelectedLabel = () => {
    const p = availablePassengers.find(p => p.id.toString() === selectedPassengerId);
    return p ? p.pessoa.nome : "Selecione...";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-visible">
        <DialogHeader>
          <DialogTitle>Vincular ao Assento {seatNumber}</DialogTitle>
          <DialogDescription>
            Selecione um passageiro da lista para ocupar este assento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="passenger-select">Passageiro Disponível</Label>
            
            {/* === COMBOBOX COM BUSCA === */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between bg-white font-normal text-left"
                >
                  <span className="truncate flex items-center gap-2">
                    {selectedPassengerId && <User className="w-4 h-4 text-gray-500" />}
                    {getSelectedLabel()}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar passageiro..." />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty>Nenhum passageiro encontrado.</CommandEmpty>
                    <CommandGroup>
                      {availablePassengers.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.pessoa.nome} // Filtra pelo nome
                          onSelect={() => {
                            setSelectedPassengerId(p.id.toString());
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPassengerId === p.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{p.pessoa.nome}</span>
                            {p.pessoa.cpf && (
                                <span className="text-xs text-gray-500">{p.pessoa.cpf}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {/* ========================== */}
            
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!selectedPassengerId}
          >
            Vincular Assento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}