import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react"; //
import { cn } from './ui/utils'; //
import { Button } from './ui/button'; 
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'; //
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'; //
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';

// Interface do Passageiro
interface PassengerData { 
    id: number;
    pessoa: { id: number; nome: string; cpf: string; }; 
    assentoId: number | null;
}

interface SeatBinderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBind: (passengerId: number, seatId: number) => void;
    availablePassengers: PassengerData[]; // Passageiros sem assento
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
    
    const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);
    const [openPopover, setOpenPopover] = useState(false);

    // Limpa o estado quando o modal fecha
    useEffect(() => {
        if (!isOpen) {
            setSelectedPassengerId(null);
            setOpenPopover(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedPassengerId && seatId) {
            onBind(Number(selectedPassengerId), seatId);
        } else {
            alert("Por favor, selecione um passageiro.");
        }
    };
    
    // Encontra o nome do passageiro selecionado para exibir no botão
    const getSelectedPassengerName = () => {
        if (!selectedPassengerId) return null;
        const passenger = availablePassengers.find(p => p.id.toString() === selectedPassengerId);
        return passenger ? `${passenger.pessoa.nome} (${passenger.pessoa.cpf})` : null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Vincular ao Assento {seatNumber}</DialogTitle>
                    <DialogDescription>
                        Selecione um passageiro disponível para este assento.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="passenger">Passageiro Disponível</Label>
                        
                        {/* ✅ CORREÇÃO 4: Combobox com busca (estilo PassengerModal) */}
                        <Popover open={openPopover} onOpenChange={setOpenPopover}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="passenger"
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between font-normal"
                                >
                                    {selectedPassengerId 
                                        ? getSelectedPassengerName() 
                                        : (availablePassengers.length === 0 ? "Nenhum passageiro livre" : "Selecione um passageiro...")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                                <Command>
                                    <CommandInput placeholder="Pesquisar por nome ou CPF..." />
                                    <CommandList>
                                        <CommandEmpty>Nenhum passageiro encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {availablePassengers.map(p => (
                                                <CommandItem 
                                                    key={p.id} 
                                                    value={`${p.pessoa.nome} ${p.pessoa.cpf}`} // Valor usado para a busca
                                                    onSelect={() => {
                                                        setSelectedPassengerId(p.id.toString());
                                                        setOpenPopover(false);
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedPassengerId === p.id.toString() ? "opacity-100" : "opacity-0")} />
                                                    {p.pessoa.nome} ({p.pessoa.cpf})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <DialogFooter className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-primary hover:bg-primary/90"
                            disabled={!selectedPassengerId || availablePassengers.length === 0}
                        >
                            Vincular Assento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}