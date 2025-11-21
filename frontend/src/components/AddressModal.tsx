import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import api from '@/services/api';

// --- INTERFACES ---
interface AddressDto {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface Address {
  id: number;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressDto) => void; 
  address: Address | null; 
}

export default function AddressModal({ isOpen, onClose, onSave, address }: AddressModalProps) {
  const [formData, setFormData] = useState<AddressDto>({
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const [isCepLoading, setIsCepLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        logradouro: address.logradouro || '',
        numero: address.numero || '',
        bairro: address.bairro || '',
        cidade: address.cidade || '',
        estado: address.estado || '',
        cep: address.cep || '',
      });
    } else {
      setFormData({
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
      });
    }
  }, [address, isOpen]);

  // --- Busca de CEP ---
  useEffect(() => {
    const cepLimpo = formData.cep.replace(/\D/g, '');

    if (cepLimpo.length === 8) {
      const fetchCep = async () => {
        setIsCepLoading(true);
        try {
          const response = await api.get(`/api/endereco/consulta-cep?cep=${cepLimpo}`);
          const { logradouro, bairro, cidade, estado, cep } = response.data;
          
          setFormData((prevData) => ({
            ...prevData,
            logradouro: logradouro || '', // Garante string vazia se vier null
            bairro: bairro || '',
            cidade: cidade || '',
            estado: estado || '',
            cep: cep || prevData.cep,
          }));
          
          document.getElementById('numero')?.focus();

        } catch (error: any) {
          console.error("Erro ao buscar CEP:", error);
        } finally {
          setIsCepLoading(false);
        }
      };

      const timerId = setTimeout(() => {
        fetchCep();
      }, 500);

      return () => clearTimeout(timerId);
    }
  }, [formData.cep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação manual simples no frontend
    if (!formData.cidade || !formData.estado) {
      alert("Cidade e Estado são obrigatórios!");
      return;
    }

    // Envia os dados (campos vazios serão enviados como strings vazias ou null, dependendo de como seu backend trata)
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{address ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
          <DialogDescription>
            Preencha os dados. <b>Apenas Cidade e Estado são obrigatórios.</b>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* CEP (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP (Opcional)</Label>
            <div className="relative">
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="00000-000"
                maxLength={9}
                // required removido
              />
              {isCepLoading && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="logradouro">Rua</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                placeholder="Rua, Avenida..."
                // required removido
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="S/N"
                // required removido
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Bairro"
              // required removido
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade" className="flex gap-1">
                Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="São Paulo"
                required // Mantido
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado" className="flex gap-1">
                Estado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="SP"
                maxLength={50} 
                required // Mantido
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {address ? 'Atualizar' : 'Criar'} Endereço
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}