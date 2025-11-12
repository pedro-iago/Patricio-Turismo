import React, { useState, useEffect } from 'react';
import { Button } from './ui/button'; 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import api from '../services/api';

// --- IMPORTS ADICIONADOS (Para Popovers de Afiliados) ---
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

// --- IMPORTS NOVOS (Para Busca Inteligente) ---
import { PessoaSearchCombobox } from './PessoaSearchCombobox';
import { AddressSearchCombobox } from './AddressSearchCombobox';
import PersonModal from './PersonModal'; // Para cadastrar novo
import AddressModal from './AddressModal'; // Para cadastrar novo

// --- Interfaces ---
interface Person {
  id: number; 
  nome: string;
  cpf: string;
}
// --- INTERFACES NOVAS (Para os modais internos) ---
interface PersonSaveDto {
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}
interface AddressSaveDto {
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
}

interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

interface PassengerData {
  id: number;
  pessoa: Person; 
  enderecoColeta: Address;
  enderecoEntrega: Address;
  taxista?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

interface PassengerSaveDto {
  pessoaId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  taxistaId?: number;
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

interface PassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passengerDto: PassengerSaveDto) => void;
  passenger: PassengerData | null;
}

// Interface de Paginação
interface Page<T> {
  content: T[];
}

// Estado inicial limpo
const initialFormData = {
  personId: null as number | null,
  pickupAddressId: null as number | null,
  dropoffAddressId: null as number | null,
  taxistaId: '',
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

export default function PassengerModal({ isOpen, onClose, onSave, passenger }: PassengerModalProps) {
  const [formData, setFormData] = useState(initialFormData);

  // --- LÓGICA ANTIGA REMOVIDA (people, addresses) ---
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  // --- POPOVERS ANTIGOS REMOVIDOS (person, pickup, dropoff) ---
  const [openTaxistaPopover, setOpenTaxistaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  // --- Estados dos Modais Internos ---
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalTarget, setAddressModalTarget] = useState<'pickupAddressId' | 'dropoffAddressId' | null>(null);

  // Busca (apenas) afiliados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const fetchAffiliates = async () => {
        setLoadingAffiliates(true);
        try {
          const [taxistasRes, comisseirosRes] = await Promise.all([
            api.get<Page<Affiliate>>('/api/v1/affiliates/taxistas?size=100'),
            api.get<Page<Affiliate>>('/api/v1/affiliates/comisseiros?size=100')
          ]);
          setTaxistas(taxistasRes.data.content);
          setComisseiros(comisseirosRes.data.content);
        } catch (error) {
          console.error("Erro ao buscar afiliados:", error);
        }
        setLoadingAffiliates(false);
      };
      fetchAffiliates();
    }
  }, [isOpen]);

  // Popula o formulário quando 'passenger' (para edição) ou 'isOpen' muda
  useEffect(() => {
    if (passenger && isOpen) {
      setFormData({
        personId: passenger.pessoa?.id || null, 
        pickupAddressId: passenger.enderecoColeta?.id || null, 
        dropoffAddressId: passenger.enderecoEntrega?.id || null,
        taxistaId: passenger.taxista?.id?.toString() || '',
        comisseiroId: passenger.comisseiro?.id?.toString() || '',
        valor: passenger.valor?.toString() || '',
        metodoPagamento: passenger.metodoPagamento || '',
        pago: passenger.pago || false,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [passenger, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personId || !formData.pickupAddressId || !formData.dropoffAddressId) {
        alert("Por favor, selecione Passageiro, Endereço de Coleta e Endereço de Entrega.");
        return;
    }
    onSave({
      pessoaId: Number(formData.personId),
      enderecoColetaId: Number(formData.pickupAddressId),
      enderecoEntregaId: Number(formData.dropoffAddressId),
      taxistaId: formData.taxistaId ? parseInt(formData.taxistaId) : undefined,
      comisseiroId: formData.comisseiroId ? parseInt(formData.comisseiroId) : undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      metodoPagamento: formData.metodoPagamento || undefined,
      pago: formData.pago,
    });
  };

  // --- Handlers para os Modais Internos (Pessoa e Endereço) ---
  const handleSaveNewPessoa = async (personDto: PersonSaveDto) => {
    try {
      const response = await api.post<Person>('/api/pessoa', personDto);
      const newPerson = response.data;
      // Atualiza o campo de Pessoa (único alvo)
      setFormData(prev => ({ ...prev, personId: newPerson.id }));
      setIsPersonModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar nova pessoa:", error);
      alert("Erro ao criar pessoa.");
    }
  };

  const handleSaveNewEndereco = async (addressDto: AddressSaveDto) => {
    try {
      const response = await api.post<Address>('/api/endereco', addressDto);
      const newAddress = response.data;
      // Atualiza o campo de endereço correto (coleta ou entrega)
      if (addressModalTarget) {
        setFormData(prev => ({ ...prev, [addressModalTarget]: newAddress.id }));
      }
      setIsAddressModalOpen(false); 
      setAddressModalTarget(null); 
    } catch (error) {
      console.error("Erro ao criar novo endereço:", error);
      alert("Erro ao criar endereço.");
    }
  };

  // Funções auxiliares para afiliados
  const getSelectedTaxistaName = () => taxistas.find(t => t.id.toString() === formData.taxistaId)?.pessoa.nome;
  const getSelectedComisseiroName = () => comisseiros.find(c => c.id.toString() === formData.comisseiroId)?.pessoa.nome;
  const getAffiliatePlaceholder = () => loadingAffiliates ? "Carregando..." : "Selecione...";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"> 
          <DialogHeader>
            <DialogTitle>{passenger ? 'Editar Passageiro' : 'Adicionar Passageiro'}</DialogTitle>
            <DialogDescription>
               Selecione um passageiro, seus endereços e informações de pagamento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ✅ Combobox de Pessoas (Refatorado) */}
            <div className="space-y-2">
              <Label htmlFor="person">Passageiro (Obrigatório)</Label>
              <PessoaSearchCombobox
                value={formData.personId}
                onSelect={(pessoaId) => setFormData({ ...formData, personId: pessoaId })}
                onAddNew={() => setIsPersonModalOpen(true)}
                onClear={() => setFormData({ ...formData, personId: null })}
              />
            </div>

            {/* ✅ Combobox de Endereço de Coleta (Refatorado) */}
            <div className="space-y-2">
              <Label htmlFor="pickup">Endereço de Coleta (Obrigatório)</Label>
              <AddressSearchCombobox
                value={formData.pickupAddressId}
                placeholder="Selecione o endereço de coleta..."
                onSelect={(addressId) => setFormData({ ...formData, pickupAddressId: addressId })}
                onAddNew={() => {
                  setAddressModalTarget('pickupAddressId');
                  setIsAddressModalOpen(true);
                }}
                onClear={() => setFormData({ ...formData, pickupAddressId: null })}
              />
            </div>

            {/* ✅ Combobox de Endereço de Entrega (Refatorado) */}
            <div className="space-y-2">
              <Label htmlFor="dropoff">Endereço de Entrega (Obrigatório)</Label>
              <AddressSearchCombobox
                value={formData.dropoffAddressId}
                placeholder="Selecione o endereço de entrega..."
                onSelect={(addressId) => setFormData({ ...formData, dropoffAddressId: addressId })}
                onAddNew={() => {
                  setAddressModalTarget('dropoffAddressId');
                  setIsAddressModalOpen(true);
                }}
                onClear={() => setFormData({ ...formData, dropoffAddressId: null })}
              />
            </div>
            
            <hr className="my-4" />

            {/* Campos de Afiliados (Lógica antiga mantida, pois funciona) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Combobox de Taxista (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="taxista">Taxista (Opcional)</Label>
                {/* ===== CORREÇÃO AQUI ===== */}
                <Popover open={openTaxistaPopover} onOpenChange={setOpenTaxistaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {formData.taxistaId ? getSelectedTaxistaName() : getAffiliatePlaceholder()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar taxista..." />
                      <CommandList>
                        <CommandEmpty>Nenhum taxista encontrado.</CommandEmpty>
                        <CommandGroup>
                          {taxistas.map((taxista) => (
                            <CommandItem key={taxista.id} value={taxista.pessoa.nome} onSelect={() => {
                                setFormData({ ...formData, taxistaId: taxista.id.toString() });
                                setOpenTaxistaPopover(false);
                            }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.taxistaId === taxista.id.toString() ? "opacity-100" : "opacity-0")} />
                              {taxista.pessoa.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Combobox de Comisseiro (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="comisseiro">Comisseiro (Opcional)</Label>
                {/* ===== CORREÇÃO AQUI ===== */}
                <Popover open={openComisseiroPopover} onOpenChange={setOpenComisseiroPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {formData.comisseiroId ? getSelectedComisseiroName() : getAffiliatePlaceholder()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar comisseiro..." />
                      <CommandList>
                        <CommandEmpty>Nenhum comisseiro encontrado.</CommandEmpty>
                        <CommandGroup>
                          {comisseiros.map((comisseiro) => (
                            <CommandItem key={comisseiro.id} value={comisseiro.pessoa.nome} onSelect={() => {
                                setFormData({ ...formData, comisseiroId: comisseiro.id.toString() });
                                setOpenComisseiroPopover(false);
                            }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.comisseiroId === comisseiro.id.toString() ? "opacity-100" : "opacity-0")} />
                              {comisseiro.pessoa.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Campos de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 150.00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodoPagamento">Método de Pagamento</Label>
                <Select
                  value={formData.metodoPagamento}
                  onValueChange={(value) => setFormData({ ...formData, metodoPagamento: value })}
                >
                  <SelectTrigger id="metodoPagamento">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="pago"
                checked={formData.pago}
                onCheckedChange={(checked) => setFormData({ ...formData, pago: checked as boolean })}
              />
              <Label htmlFor="pago" className="font-medium">
                Pagamento Efetuado?
              </Label>
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {passenger ? 'Atualizar' : 'Adicionar'} Passageiro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAIS INTERNOS --- */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSaveNewPessoa}
        person={null} 
      />
      
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setAddressModalTarget(null);
        }}
        onSave={handleSaveNewEndereco}
        address={null}
      />
    </>
  );
}