import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
// Select removido (não precisamos mais de 'status')

// --- Interfaces que combinam com o Backend ---
// DTO para salvar (corresponde a OnibusDto.java)
interface BusDto {
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

// Objeto Onibus completo (como vem da API)
interface Bus {
  idOnibus: number;
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

interface BusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bus: BusDto) => void; // Envia o DTO correto
  bus: Bus | null; // Recebe o Onibus correto
}

export default function BusModal({ isOpen, onClose, onSave, bus }: BusModalProps) {
  // --- 1. Estado do formulário agora espelha o DTO ---
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    capacidadePassageiros: '', // Formulários usam string
  });

  // 2. Efeito para popular o formulário
  useEffect(() => {
    if (bus) {
      // Modo Edição
      setFormData({
        placa: bus.placa || '',
        modelo: bus.modelo || '',
        capacidadePassageiros: bus.capacidadePassageiros?.toString() || '', // Converte número para string
      });
    } else {
      // Modo Criar
      setFormData({
        placa: '',
        modelo: '',
        capacidadePassageiros: '',
      });
    }
  }, [bus, isOpen]);

  // 3. handleSubmit envia o DTO formatado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      placa: formData.placa,
      modelo: formData.modelo,
      // Converte a capacidade de volta para número
      capacidadePassageiros: parseInt(formData.capacidadePassageiros, 10),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bus ? 'Editar ônibus' : 'Novo ônibus'}</DialogTitle>
          <DialogDescription>
            {bus ? 'Atualize as informações do ônibus abaixo.' : 'Adicione um novo ônibus à sua frota.'}
          </DialogDescription>
        </DialogHeader>
        {/* --- 4. Formulário Corrigido --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa" // ID corresponde ao state
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
              placeholder="ABC-1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo" // ID corresponde ao state
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Mercedes-Benz O500"
              required
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="capacidadePassageiros">Capacidade (assentos)</Label>
              <Input
                id="capacidadePassageiros" // ID corresponde ao state
                type="number"
                value={formData.capacidadePassageiros}
                onChange={(e) => setFormData({ ...formData, capacidadePassageiros: e.target.value })}
                placeholder="42"
                min="1"
                required
              />
          </div>

          {/* Campo 'Status' REMOVIDO */}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {bus ? 'Atualizar' : 'Criar'} Ônibus
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}