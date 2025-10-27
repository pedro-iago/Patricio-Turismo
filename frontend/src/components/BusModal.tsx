import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface BusDto {
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

interface Bus {
  idOnibus: number;
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
}

interface BusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bus: BusDto) => void; 
  bus: Bus | null; 
}

export default function BusModal({ isOpen, onClose, onSave, bus }: BusModalProps) {
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    capacidadePassageiros: '', 
  });

  useEffect(() => {
    if (bus) {
      setFormData({
        placa: bus.placa || '',
        modelo: bus.modelo || '',
        capacidadePassageiros: bus.capacidadePassageiros?.toString() || '', // Converte número para string
      });
    } else {
      setFormData({
        placa: '',
        modelo: '',
        capacidadePassageiros: '',
      });
    }
  }, [bus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      placa: formData.placa,
      modelo: formData.modelo,
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa" 
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
              placeholder="ABC-1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo" 
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Mercedes-Benz O500"
              required
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="capacidadePassageiros">Capacidade (assentos)</Label>
              <Input
                id="capacidadePassageiros" 
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