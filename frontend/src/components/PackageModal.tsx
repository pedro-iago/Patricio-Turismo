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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
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

interface PackageData {
  id: number;
  descricao: string;
  remetente: Person;
  destinatario: Person;
  enderecoColeta: Address;
  enderecoEntrega: Address;
}

interface PackageFormData {
  description: string;
  senderId: string;
  recipientId: string;
  pickupAddressId: string;
  deliveryAddressId: string;
}

interface PackageSaveDto {
  descricao: string;
  remetenteId: number;
  destinatarioId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
}

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: PackageSaveDto) => void;
  package: PackageData | null;
}

const formatAddress = (addr: Address) => {
  if (!addr) return '';
  return `${addr.logradouro}, ${addr.numero} - ${addr.cidade}`;
};

export default function PackageModal({ isOpen, onClose, onSave, package: pkg }: PackageModalProps) {
  const [formData, setFormData] = useState<PackageFormData>({
    description: '',
    senderId: '',
    recipientId: '',
    pickupAddressId: '',
    deliveryAddressId: '',
  });

  const [people, setPeople] = useState<Person[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const [openSenderPopover, setOpenSenderPopover] = useState(false);
  const [openRecipientPopover, setOpenRecipientPopover] = useState(false);
  const [openPickupPopover, setOpenPickupPopover] = useState(false);
  const [openDeliveryPopover, setOpenDeliveryPopover] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [peopleResponse, addressesResponse] = await Promise.all([
            api.get('/pessoa'),
            api.get('/endereco')
          ]);
          setPeople(peopleResponse.data);
          setAddresses(addressesResponse.data);
        } catch (error) {
          console.error("Erro ao buscar pessoas ou endereços:", error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (pkg && isOpen) {
      setFormData({
        description: pkg.descricao || '',
        senderId: pkg.remetente.id.toString(),
        recipientId: pkg.destinatario.id.toString(),
        pickupAddressId: pkg.enderecoColeta.id.toString(),
        deliveryAddressId: pkg.enderecoEntrega.id.toString(),
      });
    } else {
      setFormData({
        description: '',
        senderId: '',
        recipientId: '',
        pickupAddressId: '',
        deliveryAddressId: '',
      });
    }
  }, [pkg, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!formData.senderId || !formData.recipientId || !formData.pickupAddressId || !formData.deliveryAddressId) {
        alert("Por favor, selecione Remetente, Destinatário e os Endereços.");
        return;
    }
    onSave({
      descricao: formData.description,
      remetenteId: parseInt(formData.senderId),
      destinatarioId: parseInt(formData.recipientId),
      enderecoColetaId: parseInt(formData.pickupAddressId),
      enderecoEntregaId: parseInt(formData.deliveryAddressId),
    });
  };

  const getSelectedPersonName = (id: string) => people.find(p => p.id.toString() === id)?.nome || "";
  const getSelectedAddress = (id: string) => formatAddress(addresses.find(a => a.id.toString() === id) as Address);
  const getPlaceholder = (type: 'person' | 'address') => {
    if (loading) return `Carregando ${type === 'person' ? 'pessoas' : 'endereços'}...`;
    return `Selecione ${type === 'person' ? 'a pessoa' : 'o endereço'}...`;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{pkg ? 'Editar Encomenda' : 'Adicionar Encomenda'}</DialogTitle>
          <DialogDescription>
             Insira as informações da encomenda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a encomenda"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Combobox Remetente */}
            <div className="space-y-2">
              <Label htmlFor="sender">Remetente</Label>
               <Popover open={openSenderPopover} onOpenChange={setOpenSenderPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openSenderPopover} className="w-full justify-between font-normal">
                    {formData.senderId ? getSelectedPersonName(formData.senderId) : getPlaceholder('person')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command>
                    <CommandInput placeholder="Pesquisar remetente..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                      <CommandGroup>
                        {people.filter(p => p && p.id).map((person) => (
                          <CommandItem key={person.id} value={`${person.nome} ${person.cpf}`} onSelect={() => { setFormData({ ...formData, senderId: person.id.toString() }); setOpenSenderPopover(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.senderId === person.id.toString() ? "opacity-100" : "opacity-0")} />
                            {person.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Combobox Destinatário */}
            <div className="space-y-2">
              <Label htmlFor="recipient">Destinatário</Label>
              <Popover open={openRecipientPopover} onOpenChange={setOpenRecipientPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openRecipientPopover} className="w-full justify-between font-normal">
                    {formData.recipientId ? getSelectedPersonName(formData.recipientId) : getPlaceholder('person')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command>
                    <CommandInput placeholder="Pesquisar destinatário..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                      <CommandGroup>
                        {people.filter(p => p && p.id).map((person) => (
                          <CommandItem key={person.id} value={`${person.nome} ${person.cpf}`} onSelect={() => { setFormData({ ...formData, recipientId: person.id.toString() }); setOpenRecipientPopover(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.recipientId === person.id.toString() ? "opacity-100" : "opacity-0")} />
                            {person.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Combobox Endereço Coleta */}
          <div className="space-y-2">
            <Label htmlFor="pickup">Endereço de Coleta</Label>
             <Popover open={openPickupPopover} onOpenChange={setOpenPickupPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openPickupPopover} className="w-full justify-between font-normal">
                    {formData.pickupAddressId ? getSelectedAddress(formData.pickupAddressId) : getPlaceholder('address')}
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
                          <CommandItem key={address.id} value={formatAddress(address)} onSelect={() => { setFormData({ ...formData, pickupAddressId: address.id.toString() }); setOpenPickupPopover(false); }}>
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

          {/* Combobox Endereço Entrega */}
          <div className="space-y-2">
            <Label htmlFor="delivery">Endereço de Entrega</Label>
             <Popover open={openDeliveryPopover} onOpenChange={setOpenDeliveryPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={openDeliveryPopover} className="w-full justify-between font-normal">
                    {formData.deliveryAddressId ? getSelectedAddress(formData.deliveryAddressId) : getPlaceholder('address')}
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
                          <CommandItem key={address.id} value={formatAddress(address)} onSelect={() => { setFormData({ ...formData, deliveryAddressId: address.id.toString() }); setOpenDeliveryPopover(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", formData.deliveryAddressId === address.id.toString() ? "opacity-100" : "opacity-0")} />
                            {formatAddress(address)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {/* --- CORREÇÃO AQUI --- */}
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {pkg ? 'Atualizar' : 'Adicionar'} Encomenda
            </Button>
             {/* --- FIM DA CORREÇÃO --- */}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}