import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User } from 'lucide-react';

// Definição simples do passageiro (baseado no que o TripDetailsPage passa)
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
  availablePassengers: Passenger[]; // Lista de passageiros sem assento
  seatId: number | null;            // ID do assento no banco
  seatNumber: string;               // Número visual (ex: "01")
}

export default function SeatBinderModal({
  isOpen,
  onClose,
  onBind,
  availablePassengers,
  seatId,
  seatNumber
}: SeatBinderModalProps) {
  
  // Estado local para guardar o ID selecionado (string para funcionar bem com o Select do Shadcn)
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>('');

  // Sempre que o modal abrir, limpamos a seleção para forçar o usuário a escolher
  useEffect(() => {
    if (isOpen) {
      setSelectedPassengerId('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    // Validação: Se não escolheu nada, avisa e para.
    if (!selectedPassengerId) {
      alert("Por favor, selecione um passageiro.");
      return;
    }
    
    if (seatId === null) {
      alert("Erro: ID do assento inválido.");
      return;
    }

    // Converte para number e envia para o pai (TripDetailsPage)
    onBind(parseInt(selectedPassengerId), seatId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular ao Assento {seatNumber}</DialogTitle>
          <DialogDescription>
            Selecione um passageiro da lista para ocupar este assento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="passenger-select">Passageiro Disponível</Label>
            
            {/* Componente SELECT do Shadcn UI */}
            <Select 
              onValueChange={(val) => setSelectedPassengerId(val)} 
              value={selectedPassengerId}
            >
              <SelectTrigger id="passenger-select" className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              
              <SelectContent>
                {availablePassengers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum passageiro sem assento.
                  </div>
                ) : (
                  availablePassengers.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {p.pessoa.nome} <span className="text-gray-400 text-xs">({p.pessoa.cpf})</span>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!selectedPassengerId} // Desabilita botão se não selecionado
          >
            Vincular Assento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}