import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from './ui/utils'; 
import { Button } from './ui/button'; 
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import api from '../services/api';

// --- Interfaces ---
interface Person {
  id: number; 
  nome: string;
  cpf: string;
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

const formatAddress = (addr: Address) => {
  if (!addr) return '';
  return `${addr.logradouro}, ${addr.numero} - ${addr.cidade}`;
};

// Estado inicial limpo
const initialFormData = {
  personId: '',
  pickupAddressId: '',
  dropoffAddressId: '',
  taxistaId: '',
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

export default function PassengerModal({ isOpen, onClose, onSave, passenger }: PassengerModalProps) {
  const [formData, setFormData] = useState(initialFormData);

  const [people, setPeople] = useState<Person[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  
  const [loading, setLoading] = useState(false);

  const [openPersonPopover, setOpenPersonPopover] = useState(false);
  const [openPickupPopover, setOpenPickupPopover] = useState(false);
  const [openDropoffPopover, setOpenDropoffPopover] = useState(false);
  const [openTaxistaPopover, setOpenTaxistaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  // Busca todos os dados necessários para os formulários
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [peopleRes, addressesRes, taxistasRes, comisseirosRes] = await Promise.all([
            api.get('/pessoa'),
            api.get('/endereco'),
            api.get('/api/v1/affiliates/taxistas'),
            api.get('/api/v1/affiliates/comisseiros')
          ]);
          setPeople(peopleRes.data);
          setAddresses(addressesRes.data);
          setTaxistas(taxistasRes.data);
          setComisseiros(comisseirosRes.data);
        } catch (error) {
          console.error("Erro ao buscar dados para o modal:", error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [isOpen]);

  // Popula o formulário quando 'passenger' (para edição) ou 'isOpen' muda
  useEffect(() => {
    if (passenger && isOpen) {
      setFormData({
        personId: passenger.pessoa?.id?.toString() || '', 
        pickupAddressId: passenger.enderecoColeta?.id?.toString() || '', 
        dropoffAddressId: passenger.enderecoEntrega?.id?.toString() || '',
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
      pessoaId: parseInt(formData.personId),
      enderecoColetaId: parseInt(formData.pickupAddressId),
      enderecoEntregaId: parseInt(formData.dropoffAddressId),
      taxistaId: formData.taxistaId ? parseInt(formData.taxistaId) : undefined,
      comisseiroId: formData.comisseiroId ? parseInt(formData.comisseiroId) : undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      metodoPagamento: formData.metodoPagamento || undefined,
      pago: formData.pago,
    });
  };

  // Funções auxiliares para mostrar o nome/endereço selecionado no botão do Combobox
  const getSelectedPersonName = () => people.find(p => p.id.toString() === formData.personId)?.nome;
  const getSelectedPickupAddress = () => formatAddress(addresses.find(a => a.id.toString() === formData.pickupAddressId) as Address);
  const getSelectedDropoffAddress = () => formatAddress(addresses.find(a => a.id.toString() === formData.dropoffAddressId) as Address);
  const getSelectedTaxistaName = () => taxistas.find(t => t.id.toString() === formData.taxistaId)?.pessoa.nome;
  const getSelectedComisseiroName = () => comisseiros.find(c => c.id.toString() === formData.comisseiroId)?.pessoa.nome;

  const getPlaceholder = (type: 'person' | 'address' | 'taxista' | 'comisseiro') => {
    if (loading) return "Carregando...";
    return `Selecione...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]"> 
        <DialogHeader>
          <DialogTitle>{passenger ? 'Editar Passageiro' : 'Adicionar Passageiro'}</DialogTitle>
          <DialogDescription>
             Selecione um passageiro, seus endereços e informações de pagamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Combobox de Pessoas */}
          <div className="space-y-2">
            <Label htmlFor="person">Passageiro (Obrigatório)</Label>
            <Popover open={openPersonPopover} onOpenChange={setOpenPersonPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  {formData.personId ? getSelectedPersonName() : getPlaceholder('person')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar pessoa..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                    <CommandGroup>
                      {people.filter(p => p && p.id).map((person) => (
                        <CommandItem key={person.id} value={`${person.nome} ${person.cpf}`} onSelect={() => {
                            setFormData({ ...formData, personId: person.id.toString() });
                            setOpenPersonPopover(false);
                        }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.personId === person.id.toString() ? "opacity-100" : "opacity-0")} />
                          {person.nome} - (CPF: {person.cpf})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* --- CÓDIGO RESTAURADO ABAIXO --- */}

          {/* Combobox de Endereço de Coleta */}
          <div className="space-y-2">
            <Label htmlFor="pickup">Endereço de Coleta (Obrigatório)</Label>
            <Popover open={openPickupPopover} onOpenChange={setOpenPickupPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openPickupPopover} className="w-full justify-between font-normal">
                  {formData.pickupAddressId ? getSelectedPickupAddress() : getPlaceholder('address')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar endereço..." />
                  <CommandList>
                    <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
                    <CommandGroup>
                      {addresses.filter(a => a && a.id).map((address) => (
                        <CommandItem key={address.id} value={formatAddress(address)} onSelect={() => {
                            setFormData({ ...formData, pickupAddressId: address.id.toString() });
                            setOpenPickupPopover(false);
                        }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.pickupAddressId === address.id.toString() ? "opacity-100" : "opacity-0")} />
                          {formatAddress(address)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Combobox de Endereço de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="dropoff">Endereço de Entrega (Obrigatório)</Label>
            <Popover open={openDropoffPopover} onOpenChange={setOpenDropoffPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openDropoffPopover} className="w-full justify-between font-normal">
                  {formData.dropoffAddressId ? getSelectedDropoffAddress() : getPlaceholder('address')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command>
                  <CommandInput placeholder="Pesquisar endereço..." />
                  <CommandList>
                    <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
                    <CommandGroup>
                      {addresses.filter(a => a && a.id).map((address) => (
                        <CommandItem key={address.id} value={formatAddress(address)} onSelect={() => {
                            setFormData({ ...formData, dropoffAddressId: address.id.toString() });
                            setOpenDropoffPopover(false);
                        }}>
                          <Check className={cn("mr-2 h-4 w-4", formData.dropoffAddressId === address.id.toString() ? "opacity-100" : "opacity-0")} />
                          {formatAddress(address)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* --- FIM DO CÓDIGO RESTAURADO --- */}

          <hr className="my-4" />

          {/* --- Novos Campos (Afiliados, Pagamento) --- */}

          <div className="grid grid-cols-2 gap-4">
            {/* Combobox de Taxista (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="taxista">Taxista (Opcional)</Label>
              <Popover open={openTaxistaPopover} onOpenChange={setOpenTaxistaPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.taxistaId ? getSelectedTaxistaName() : getPlaceholder('taxista')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command>
                    <CommandInput placeholder="Pesquisar taxista..." />
                    <CommandList>
                      <CommandEmpty>Nenhum taxista encontrado.</CommandEmpty>
                      <CommandGroup>
                        {taxistas.filter(t => t && t.id).map((taxista) => (
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
              <Popover open={openComisseiroPopover} onOpenChange={setOpenComisseiroPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    {formData.comisseiroId ? getSelectedComisseiroName() : getPlaceholder('comisseiro')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command>
                    <CommandInput placeholder="Pesquisar comisseiro..." />
                    <CommandList>
                      <CommandEmpty>Nenhum comisseiro encontrado.</CommandEmpty>
                      <CommandGroup>
                        {comisseiros.filter(c => c && c.id).map((comisseiro) => (
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {passenger ? 'Atualizar' : 'Adicionar'} Passageiro
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}