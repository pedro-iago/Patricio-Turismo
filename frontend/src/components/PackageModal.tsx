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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'; // <<< Importado
import { Checkbox } from './ui/checkbox'; // <<< Importado
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

// --- NOVAS INTERFACES (AFILIADOS) ---
interface AffiliatePerson {
  id: number;
  nome: string;
}
interface Affiliate {
  id: number;
  pessoa: AffiliatePerson;
}

// Interface dos dados recebidos (quando editando)
interface PackageData {
  id: number;
  descricao: string;
  remetente: Person;
  destinatario: Person;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  // Novos campos
  taxista?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

// Interface do FormData (estado local)
interface PackageFormData {
  description: string;
  senderId: string;
  recipientId: string;
  pickupAddressId: string;
  deliveryAddressId: string;
  // Novos campos
  taxistaId: string;
  comisseiroId: string;
  valor: string;
  metodoPagamento: string;
  pago: boolean;
}

// Interface do DTO que o backend espera (do EncomendaDto.java)
interface PackageSaveDto {
  descricao: string;
  remetenteId: number;
  destinatarioId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  // Novos campos
  taxistaId?: number;
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
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

// Estado inicial limpo
const initialFormData: PackageFormData = {
  description: '',
  senderId: '',
  recipientId: '',
  pickupAddressId: '',
  deliveryAddressId: '',
  taxistaId: '',
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

export default function PackageModal({ isOpen, onClose, onSave, package: pkg }: PackageModalProps) {
  const [formData, setFormData] = useState<PackageFormData>(initialFormData);

  // --- Listas de dados ---
  const [people, setPeople] = useState<Person[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  
  const [loading, setLoading] = useState(false);

  // --- Controles de Popover ---
  const [openSenderPopover, setOpenSenderPopover] = useState(false);
  const [openRecipientPopover, setOpenRecipientPopover] = useState(false);
  const [openPickupPopover, setOpenPickupPopover] = useState(false);
  const [openDeliveryPopover, setOpenDeliveryPopover] = useState(false);
  const [openTaxistaPopover, setOpenTaxistaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  // Busca todos os dados para os Comboboxes
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

  // Popula o formulário se estiver editando (pkg)
  useEffect(() => {
    if (pkg && isOpen) {
      setFormData({
        description: pkg.descricao || '',
        senderId: pkg.remetente.id.toString(),
        recipientId: pkg.destinatario.id.toString(),
        pickupAddressId: pkg.enderecoColeta.id.toString(),
        deliveryAddressId: pkg.enderecoEntrega.id.toString(),
        // --- Popula novos campos ---
        taxistaId: pkg.taxista?.id?.toString() || '',
        comisseiroId: pkg.comisseiro?.id?.toString() || '',
        valor: pkg.valor?.toString() || '',
        metodoPagamento: pkg.metodoPagamento || '',
        pago: pkg.pago || false,
      });
    } else {
      setFormData(initialFormData); // Limpa o formulário
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
      // --- Envia novos campos ---
      taxistaId: formData.taxistaId ? parseInt(formData.taxistaId) : undefined,
      comisseiroId: formData.comisseiroId ? parseInt(formData.comisseiroId) : undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      metodoPagamento: formData.metodoPagamento || undefined,
      pago: formData.pago,
    });
  };

  // Funções auxiliares para mostrar o nome/endereço no botão do Combobox
  const getSelectedPersonName = (id: string) => people.find(p => p.id.toString() === id)?.nome;
  const getSelectedAddress = (id: string) => formatAddress(addresses.find(a => a.id.toString() === id) as Address);
  const getSelectedTaxistaName = () => taxistas.find(t => t.id.toString() === formData.taxistaId)?.pessoa.nome;
  const getSelectedComisseiroName = () => comisseiros.find(c => c.id.toString() === formData.comisseiroId)?.pessoa.nome;
  
  const getPlaceholder = (type: 'person' | 'address' | 'taxista' | 'comisseiro') => {
    if (loading) return `Carregando...`;
    return `Selecione ${type}...`;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]"> {/* Modal maior */}
        <DialogHeader>
          <DialogTitle>{pkg ? 'Editar Encomenda' : 'Adicionar Encomenda'}</DialogTitle>
          <DialogDescription>
             Insira as informações da encomenda, afiliados e pagamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Obrigatório)</Label>
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
              <Label htmlFor="sender">Remetente (Obrigatório)</Label>
               <Popover open={openSenderPopover} onOpenChange={setOpenSenderPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
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
              <Label htmlFor="recipient">Destinatário (Obrigatório)</Label>
              <Popover open={openRecipientPopover} onOpenChange={setOpenRecipientPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
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
            <Label htmlFor="pickup">Endereço de Coleta (Obrigatório)</Label>
             <Popover open={openPickupPopover} onOpenChange={setOpenPickupPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
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
            <Label htmlFor="delivery">Endereço de Entrega (Obrigatório)</Label>
             <Popover open={openDeliveryPopover} onOpenChange={setOpenDeliveryPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
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
          
          <hr className="my-4" />

          {/* --- NOVOS CAMPOS DO FORMULÁRIO ADICIONADOS --- */}
          
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
          
          {/* Grid para Valor e Método de Pagamento */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="Ex: 50.00"
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
          
          {/* Campo Pago */}
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
          
          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {pkg ? 'Atualizar' : 'Adicionar'} Encomenda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}