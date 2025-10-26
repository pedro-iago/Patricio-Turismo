import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
// --- CORRECTED IMPORTS ---
import { cn } from './ui/utils'; // Relative path
import { Button } from './ui/button'; // Relative path
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'; // Relative path
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'; // Relative path
// --- END CORRECTED IMPORTS ---
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import api from '../services/api';

// --- Interfaces ---
interface Person {
  id: number; // <-- 1. CORRIGIDO PARA 'id'
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

interface PassengerData {
  id: number;
  pessoa: Person; // Usará a interface Person atualizada
  enderecoColeta: Address;
  enderecoEntrega: Address;
}

interface PassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passengerDto: { personId: number; pickupAddressId: number; dropoffAddressId: number }) => void;
  passenger: PassengerData | null;
}

const formatAddress = (addr: Address) => {
  if (!addr) return '';
  return `${addr.logradouro}, ${addr.numero} - ${addr.cidade}`;
};

export default function PassengerModal({ isOpen, onClose, onSave, passenger }: PassengerModalProps) {
  const [formData, setFormData] = useState({
    personId: '',
    pickupAddressId: '',
    dropoffAddressId: '',
  });

  const [people, setPeople] = useState<Person[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const [openPersonPopover, setOpenPersonPopover] = useState(false);
  const [openPickupPopover, setOpenPickupPopover] = useState(false);
  const [openDropoffPopover, setOpenDropoffPopover] = useState(false);

  // Busca Pessoas e Endereços (sem mudança)
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [peopleResponse, addressesResponse] = await Promise.all([
            api.get('/pessoa'),
            api.get('/endereco')
          ]);
          // Log para verificar os dados recebidos da API
          console.log("Pessoas recebidas:", peopleResponse.data);
          console.log("Endereços recebidos:", addressesResponse.data);
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

  // Popula o formulário ao editar
  useEffect(() => {
    if (passenger && isOpen) {
      // Usa 'id' da interface Person atualizada
      setFormData({
        personId: passenger.pessoa?.id?.toString() || '', // <-- 2. CORRIGIDO PARA 'id' (com safe navigation)
        pickupAddressId: passenger.enderecoColeta?.id?.toString() || '', // Added safe navigation
        dropoffAddressId: passenger.enderecoEntrega?.id?.toString() || '', // Added safe navigation
      });
    } else {
      setFormData({
        personId: '',
        pickupAddressId: '',
        dropoffAddressId: '',
      });
    }
  }, [passenger, isOpen]);

  // handleSubmit (sem mudança)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personId || !formData.pickupAddressId || !formData.dropoffAddressId) {
        alert("Por favor, selecione Passageiro, Endereço de Coleta e Endereço de Entrega.");
        return;
    }
    onSave({
      personId: parseInt(formData.personId),
      pickupAddressId: parseInt(formData.pickupAddressId),
      dropoffAddressId: parseInt(formData.dropoffAddressId),
    });
  };

  // Funções auxiliares para encontrar o nome/endereço selecionado
  const getSelectedPersonName = () => people.find(p => p.id.toString() === formData.personId)?.nome || "Selecione a pessoa...";
  const getSelectedPickupAddress = () => formatAddress(addresses.find(a => a.id.toString() === formData.pickupAddressId) as Address);
  const getSelectedDropoffAddress = () => formatAddress(addresses.find(a => a.id.toString() === formData.dropoffAddressId) as Address);

  const getPlaceholder = (type: 'person' | 'address') => {
    if (loading) return `Carregando ${type === 'person' ? 'pessoas' : 'endereços'}...`;
    return `Selecione ${type === 'person' ? 'a pessoa' : 'o endereço'}...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{passenger ? 'Editar Passageiro' : 'Adicionar Passageiro'}</DialogTitle>
          <DialogDescription>
             Selecione um passageiro e seus endereços.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Combobox de Pessoas */}
          <div className="space-y-2">
            <Label htmlFor="person">Passageiro</Label>
            <Popover open={openPersonPopover} onOpenChange={setOpenPersonPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPersonPopover}
                  className="w-full justify-between font-normal"
                >
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
                      {/* 3. CORRIGIDO PARA 'id' */}
                      {people.filter(p => p && p.id).map((person) => (
                        <CommandItem
                          // 4. CORRIGIDO PARA 'id'
                          key={person.id}
                          value={`${person.nome} ${person.cpf}`}
                          onSelect={() => {
                            // 5. CORRIGIDO PARA 'id'
                            setFormData({ ...formData, personId: person.id.toString() });
                            setOpenPersonPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              // 6. CORRIGIDO PARA 'id'
                              formData.personId === person.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {person.nome} - (CPF: {person.cpf})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Combobox de Endereço de Coleta (sem mudança aqui) */}
          <div className="space-y-2">
            <Label htmlFor="pickup">Endereço de Coleta</Label>
            <Popover open={openPickupPopover} onOpenChange={setOpenPickupPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPickupPopover}
                  className="w-full justify-between font-normal"
                >
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
                        <CommandItem
                          key={address.id}
                          value={formatAddress(address)}
                          onSelect={() => {
                            setFormData({ ...formData, pickupAddressId: address.id.toString() });
                            setOpenPickupPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.pickupAddressId === address.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {formatAddress(address)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Combobox de Endereço de Entrega (sem mudança aqui) */}
          <div className="space-y-2">
            <Label htmlFor="dropoff">Endereço de Entrega</Label>
            <Popover open={openDropoffPopover} onOpenChange={setOpenDropoffPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDropoffPopover}
                  className="w-full justify-between font-normal"
                >
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
                        <CommandItem
                          key={address.id}
                          value={formatAddress(address)}
                          onSelect={() => {
                            setFormData({ ...formData, dropoffAddressId: address.id.toString() });
                            setOpenDropoffPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.dropoffAddressId === address.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {formatAddress(address)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Botões */}
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