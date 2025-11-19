import React, { useState, useEffect } from 'react';
import { Button } from './ui/button'; 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import api from '../services/api';

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

import { PessoaSearchCombobox } from './PessoaSearchCombobox';
import { AddressSearchCombobox } from './AddressSearchCombobox';
import PersonModal from './PersonModal';
import AddressModal from './AddressModal';

// --- Interfaces ---
interface Person { id: number; nome: string; cpf: string; }
interface PersonSaveDto { nome: string; cpf: string; telefone: string | null; idade: number | null; }
interface AddressSaveDto { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

interface PassengerData {
  id: number;
  pessoa: Person; 
  enderecoColeta?: Address; // Opcional
  enderecoEntrega?: Address; // Opcional
  taxistaColeta?: Affiliate; 
  taxistaEntrega?: Affiliate; 
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

interface PassengerSaveDto {
  pessoaId: number;
  enderecoColetaId?: number; // Opcional no DTO
  enderecoEntregaId?: number; // Opcional no DTO
  taxistaColetaId?: number;
  taxistaEntregaId?: number;
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

interface Page<T> { content: T[]; }

const initialFormData = {
  personId: null as number | null,
  pickupAddressId: null as number | null,
  dropoffAddressId: null as number | null,
  taxistaColetaId: '',
  taxistaEntregaId: '',
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

export default function PassengerModal({ isOpen, onClose, onSave, passenger }: PassengerModalProps) {
  const [formData, setFormData] = useState(initialFormData);

  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  const [openTaxistaColetaPopover, setOpenTaxistaColetaPopover] = useState(false);
  const [openTaxistaEntregaPopover, setOpenTaxistaEntregaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalTarget, setAddressModalTarget] = useState<'pickupAddressId' | 'dropoffAddressId' | null>(null);

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

  useEffect(() => {
    if (passenger && isOpen) {
      setFormData({
        personId: passenger.pessoa?.id || null, 
        pickupAddressId: passenger.enderecoColeta?.id || null, 
        dropoffAddressId: passenger.enderecoEntrega?.id || null,
        taxistaColetaId: passenger.taxistaColeta?.id?.toString() || '', 
        taxistaEntregaId: passenger.taxistaEntrega?.id?.toString() || '', 
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
    // --- MUDANÇA: Validação relaxada (apenas Pessoa é obrigatória) ---
    if (!formData.personId) {
        alert("Por favor, selecione o Passageiro.");
        return;
    }
    onSave({
      pessoaId: Number(formData.personId),
      // Envia undefined se for null, permitindo endereço vazio
      enderecoColetaId: formData.pickupAddressId ? Number(formData.pickupAddressId) : undefined,
      enderecoEntregaId: formData.dropoffAddressId ? Number(formData.dropoffAddressId) : undefined,
      taxistaColetaId: formData.taxistaColetaId ? parseInt(formData.taxistaColetaId) : undefined, 
      taxistaEntregaId: formData.taxistaEntregaId ? parseInt(formData.taxistaEntregaId) : undefined, 
      comisseiroId: formData.comisseiroId ? parseInt(formData.comisseiroId) : undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      metodoPagamento: formData.metodoPagamento || undefined,
      pago: formData.pago,
    });
  };

  const handleSaveNewPessoa = async (personDto: PersonSaveDto) => {
    try {
      const response = await api.post<Person>('/api/pessoa', personDto);
      const newPerson = response.data;
      setFormData(prev => ({ ...prev, personId: newPerson.id }));
      setIsPersonModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar nova pessoa:", error);
    }
  };

  const handleSaveNewEndereco = async (addressDto: AddressSaveDto) => {
    try {
      const response = await api.post<Address>('/api/endereco', addressDto);
      const newAddress = response.data;
      if (addressModalTarget) {
        setFormData(prev => ({ ...prev, [addressModalTarget]: newAddress.id }));
      }
      setIsAddressModalOpen(false); 
      setAddressModalTarget(null); 
    } catch (error) {
      console.error("Erro ao criar novo endereço:", error);
    }
  };

  const getSelectedTaxistaColetaName = () => taxistas.find(t => t.id.toString() === formData.taxistaColetaId)?.pessoa.nome;
  const getSelectedTaxistaEntregaName = () => taxistas.find(t => t.id.toString() === formData.taxistaEntregaId)?.pessoa.nome;
  const getSelectedComisseiroName = () => comisseiros.find(c => c.id.toString() === formData.comisseiroId)?.pessoa.nome;
  const getAffiliatePlaceholder = () => loadingAffiliates ? "Carregando..." : "Selecione...";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"> 
          <DialogHeader>
            <DialogTitle>{passenger ? 'Editar Passageiro' : 'Adicionar Passageiro'}</DialogTitle>
            <DialogDescription>
               Selecione um passageiro e seus dados. Endereços são opcionais.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="person">Passageiro (Obrigatório)</Label>
              <PessoaSearchCombobox
                value={formData.personId}
                onSelect={(pessoaId) => setFormData({ ...formData, personId: pessoaId })}
                onAddNew={() => setIsPersonModalOpen(true)}
                onClear={() => setFormData({ ...formData, personId: null })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">Coleta (Opcional)</Label>
                <AddressSearchCombobox
                  value={formData.pickupAddressId}
                  placeholder="Endereço de coleta..."
                  onSelect={(addressId) => setFormData({ ...formData, pickupAddressId: addressId })}
                  onAddNew={() => {
                    setAddressModalTarget('pickupAddressId');
                    setIsAddressModalOpen(true);
                  }}
                  onClear={() => setFormData({ ...formData, pickupAddressId: null })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoff">Entrega (Opcional)</Label>
                <AddressSearchCombobox
                  value={formData.dropoffAddressId}
                  placeholder="Endereço de entrega..."
                  onSelect={(addressId) => setFormData({ ...formData, dropoffAddressId: addressId })}
                  onAddNew={() => {
                    setAddressModalTarget('dropoffAddressId');
                    setIsAddressModalOpen(true);
                  }}
                  onClear={() => setFormData({ ...formData, dropoffAddressId: null })}
                />
              </div>
            </div>
            
            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxistaColeta">Taxista (Coleta)</Label>
                <Popover open={openTaxistaColetaPopover} onOpenChange={setOpenTaxistaColetaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {formData.taxistaColetaId ? getSelectedTaxistaColetaName() : getAffiliatePlaceholder()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar..." />
                      <CommandList>
                        <CommandEmpty>Nenhum encontrado.</CommandEmpty>
                        <CommandGroup>
                          {taxistas.map((taxista) => (
                            <CommandItem key={taxista.id} value={taxista.pessoa.nome} onSelect={() => {
                                setFormData({ ...formData, taxistaColetaId: taxista.id.toString() });
                                setOpenTaxistaColetaPopover(false);
                            }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.taxistaColetaId === taxista.id.toString() ? "opacity-100" : "opacity-0")} />
                              {taxista.pessoa.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxistaEntrega">Taxista (Entrega)</Label>
                <Popover open={openTaxistaEntregaPopover} onOpenChange={setOpenTaxistaEntregaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {formData.taxistaEntregaId ? getSelectedTaxistaEntregaName() : getAffiliatePlaceholder()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar..." />
                      <CommandList>
                        <CommandEmpty>Nenhum encontrado.</CommandEmpty>
                        <CommandGroup>
                          {taxistas.map((taxista) => (
                            <CommandItem key={taxista.id} value={taxista.pessoa.nome} onSelect={() => {
                                setFormData({ ...formData, taxistaEntregaId: taxista.id.toString() });
                                setOpenTaxistaEntregaPopover(false);
                            }}>
                              <Check className={cn("mr-2 h-4 w-4", formData.taxistaEntregaId === taxista.id.toString() ? "opacity-100" : "opacity-0")} />
                              {taxista.pessoa.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comisseiro">Comisseiro</Label>
              <Popover open={openComisseiroPopover} onOpenChange={setOpenComisseiroPopover} modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.comisseiroId ? getSelectedComisseiroName() : getAffiliatePlaceholder()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Pesquisar..." />
                    <CommandList>
                      <CommandEmpty>Nenhum encontrado.</CommandEmpty>
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
                <Label htmlFor="metodoPagamento">Método</Label>
                <Select
                  value={formData.metodoPagamento}
                  onValueChange={(value) => setFormData({ ...formData, metodoPagamento: value })}
                >
                  <SelectTrigger id="metodoPagamento">
                    <SelectValue placeholder="Selecione" />
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
                {passenger ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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