import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

// --- IMPORTS NOVOS ---
import { Loader2 } from 'lucide-react'; // Ícone de loading
import api from '@/services/api'; // O seu cliente axios
import { useToast } from './ui/use-toast'; // (Opcional, mas recomendado)

// --- INTERFACES (sem mudança) ---
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

  // --- ESTADO NOVO ---
  const [isCepLoading, setIsCepLoading] = useState(false);
  // const { toast } = useToast(); // Descomente se quiser usar 'toast' para erros

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
      // Limpa o formulário se for um novo endereço
      setFormData({
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
      });
    }
  }, [address, isOpen]); // Roda quando o modal abre ou o 'address' muda

  // --- LÓGICA NOVA (Passo 5: ViaCEP) ---
  useEffect(() => {
    // Remove tudo o que não for dígito
    const cepLimpo = formData.cep.replace(/\D/g, '');

    // Só faz a busca se tiver 8 dígitos
    if (cepLimpo.length === 8) {
      const fetchCep = async () => {
        setIsCepLoading(true);
        try {
          // Chama o endpoint do NOSSO backend que criámos
          const response = await api.get(`/api/endereco/consulta-cep?cep=${cepLimpo}`);
          
          const { logradouro, bairro, cidade, estado, cep } = response.data;
          
          // Atualiza o formulário com os dados recebidos
          setFormData((prevData) => ({
            ...prevData,
            logradouro: logradouro,
            bairro: bairro,
            cidade: cidade,
            estado: estado,
            cep: cep, // Usa o CEP formatado que veio da API
          }));
          
          // (Opcional) Foca no campo 'numero'
          document.getElementById('numero')?.focus();

        } catch (error: any) {
          console.error("Erro ao buscar CEP:", error);
          // (Opcional) Mostra um 'toast' de erro
          // toast({
          //   variant: "destructive",
          //   title: "CEP não encontrado",
          //   description: error.response?.data || "Não foi possível consultar o CEP.",
          // });
        } finally {
          setIsCepLoading(false);
        }
      };

      // Usamos um timeout para não fazer a busca a cada tecla (debounce)
      const timerId = setTimeout(() => {
        fetchCep();
      }, 500); // 500ms de atraso

      return () => clearTimeout(timerId); // Limpa o timeout se o CEP mudar
    }
  }, [formData.cep]); // Dispara este efeito sempre que o CEP mudar


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{address ? 'Editar Endereço' : 'Novo Endereço'}</DialogTitle>
          <DialogDescription>
            {address ? 'Atualize os detalhes do endereço abaixo.' : 'Insira o CEP para autocompletar ou preencha manualmente.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- CAMPO DE CEP ATUALIZADO --- */}
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="relative">
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                placeholder="01310-100"
                required
                maxLength={9} // Ex: 00000-000
              />
              {isCepLoading && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          
          {/* O resto do formulário */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="logradouro">Rua</Label>
              <Input
                id="logradouro"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                placeholder="Av. Paulista"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="1000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              placeholder="Bela Vista"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="São Paulo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="SP"
                maxLength={50} 
                required
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