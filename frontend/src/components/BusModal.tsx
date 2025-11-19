import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea'; // Importe ou use <textarea className... />

interface BusDto {
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
  layoutJson?: string; // Campo novo
}

interface Bus {
  id: number; 
  placa: string;
  modelo: string;
  capacidadePassageiros: number;
  layoutJson?: string; // Campo novo vindo do backend
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
    layoutJson: '', // Estado para o JSON
  });

  useEffect(() => {
    if (bus) {
      setFormData({
        placa: bus.placa || '',
        modelo: bus.modelo || '',
        capacidadePassageiros: bus.capacidadePassageiros?.toString() || '',
        layoutJson: bus.layoutJson || '',
      });
    } else {
      setFormData({
        placa: '',
        modelo: '',
        capacidadePassageiros: '',
        layoutJson: '',
      });
    }
  }, [bus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      placa: formData.placa,
      modelo: formData.modelo,
      capacidadePassageiros: parseInt(formData.capacidadePassageiros, 10),
      layoutJson: formData.layoutJson || undefined, // Envia undefined se estiver vazio
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bus ? 'Editar ônibus' : 'Novo ônibus'}</DialogTitle>
          <DialogDescription>
            Configure os dados do veículo e o layout das poltronas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="capacidadePassageiros">Capacidade</Label>
                <Input
                    id="capacidadePassageiros" 
                    type="number"
                    value={formData.capacidadePassageiros}
                    onChange={(e) => setFormData({ ...formData, capacidadePassageiros: e.target.value })}
                    placeholder="Ex: 44"
                    min="1"
                    required
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo" 
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              placeholder="Scania Marcopolo LD"
              required
            />
          </div>

          {/* Campo Avançado para Layout JSON */}
          <div className="space-y-2 border-t pt-4 mt-2">
             <Label htmlFor="layoutJson" className="text-blue-600">Layout Personalizado (JSON)</Label>
             <p className="text-xs text-gray-500">
                Cole aqui a matriz de assentos (ex: [[1,2],[3,4]]). Se deixar vazio, o sistema usará o layout padrão sequencial.
             </p>
             <Textarea 
                id="layoutJson"
                value={formData.layoutJson}
                onChange={(e) => setFormData({ ...formData, layoutJson: e.target.value })}
                placeholder='[[1,2,4,3], [5,6,8,7]...]'
                className="font-mono text-xs h-24"
             />
          </div>

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