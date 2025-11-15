import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
interface PersonDto {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}
interface PersonSaveDto {
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}
interface AddressDto {
  id: number;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}
interface AddressSaveDto {
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

// --- MUDANÇA: Interface de dados recebidos (edição) ---
interface PackageData {
  id: number;
  descricao: string;
  remetente: PersonDto;
  destinatario: PersonDto;
  enderecoColeta: AddressDto;
  enderecoEntrega: AddressDto;
  // taxista?: Affiliate; // <-- REMOVIDO
  taxistaColeta?: Affiliate; // <-- ADICIONADO
  taxistaEntrega?: Affiliate; // <-- ADICIONADO
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

// --- MUDANÇA: Interface do DTO de salvamento ---
interface PackageSaveDto {
  descricao: string;
  remetenteId: number;
  destinatarioId: number;
  enderecoColetaId: number;
  enderecoEntregaId: number;
  // taxistaId?: number; // <-- REMOVIDO
  taxistaColetaId?: number; // <-- ADICIONADO
  taxistaEntregaId?: number; // <-- ADICIONADO
  comisseiroId?: number;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  number: number;
}

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: PackageSaveDto) => void;
  package: PackageData | null;
}

// --- MUDANÇA: Estado inicial limpo ---
const initialFormData = {
  description: '',
  senderId: null as number | null,
  recipientId: null as number | null,
  pickupAddressId: null as number | null,
  deliveryAddressId: null as number | null,
  // taxistaId: '', // <-- REMOVIDO
  taxistaColetaId: '', // <-- ADICIONADO
  taxistaEntregaId: '', // <-- ADICIONADO
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

export default function PackageModal({ isOpen, onClose, onSave, package: pkg }: PackageModalProps) {
  const [formData, setFormData] = useState(initialFormData);

  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  // --- MUDANÇA: Popovers de Taxista ---
  const [openTaxistaColetaPopover, setOpenTaxistaColetaPopover] = useState(false);
  const [openTaxistaEntregaPopover, setOpenTaxistaEntregaPopover] = useState(false);
  // --- FIM DA MUDANÇA ---
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [personModalTarget, setPersonModalTarget] = useState<'senderId' | 'recipientId' | null>(null);
  const [addressModalTarget, setAddressModalTarget] = useState<'pickupAddressId' | 'deliveryAddressId' | null>(null);


  // Busca (apenas) afiliados quando o modal abre (Sem alteração)
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

  // --- MUDANÇA: Popula o formulário para edição ---
  useEffect(() => {
    if (pkg && isOpen) {
      setFormData({
        description: pkg.descricao || '',
        senderId: pkg.remetente?.id || null,
        recipientId: pkg.destinatario?.id || null,
        pickupAddressId: pkg.enderecoColeta?.id || null,
        deliveryAddressId: pkg.enderecoEntrega?.id || null,
        // taxistaId: pkg.taxista?.id?.toString() || '', // <-- REMOVIDO
        taxistaColetaId: pkg.taxistaColeta?.id?.toString() || '', // <-- ADICIONADO
        taxistaEntregaId: pkg.taxistaEntrega?.id?.toString() || '', // <-- ADICIONADO
        comisseiroId: pkg.comisseiro?.id?.toString() || '',
        valor: pkg.valor?.toString() || '',
        metodoPagamento: pkg.metodoPagamento || '',
        pago: pkg.pago || false,
      });
    } else {
      setFormData(initialFormData); // Limpa o formulário
    }
  }, [pkg, isOpen]);

  // Handlers para os Modais Internos (Sem alteração)
  const handleSaveNewPessoa = async (personDto: PersonSaveDto) => {
    try {
      const response = await api.post<PersonDto>('/api/pessoa', personDto);
      const newPerson = response.data;
      if (personModalTarget) {
        setFormData(prev => ({ ...prev, [personModalTarget]: newPerson.id }));
      }
      setIsPersonModalOpen(false);
      setPersonModalTarget(null);
    } catch (error) {
      console.error("Erro ao criar nova pessoa:", error);
      alert("Erro ao criar pessoa.");
    }
  };

  const handleSaveNewEndereco = async (addressDto: AddressSaveDto) => {
    try {
      const response = await api.post<AddressDto>('/api/endereco', addressDto);
      const newAddress = response.data;
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

  // --- MUDANÇA: Handler Principal (Submit) ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!formData.senderId || !formData.recipientId || !formData.pickupAddressId || !formData.deliveryAddressId) {
        alert("Por favor, selecione Remetente, Destinatário e os Endereços.");
        return;
    }
    onSave({
      descricao: formData.description,
      remetenteId: Number(formData.senderId),
      destinatarioId: Number(formData.recipientId),
      enderecoColetaId: Number(formData.pickupAddressId),
      enderecoEntregaId: Number(formData.deliveryAddressId),
      // taxistaId: formData.taxistaId ? Number(formData.taxistaId) : undefined, // <-- REMOVIDO
      taxistaColetaId: formData.taxistaColetaId ? Number(formData.taxistaColetaId) : undefined, // <-- ADICIONADO
      taxistaEntregaId: formData.taxistaEntregaId ? Number(formData.taxistaEntregaId) : undefined, // <-- ADICIONADO
      comisseiroId: formData.comisseiroId ? Number(formData.comisseiroId) : undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      metodoPagamento: formData.metodoPagamento || undefined,
      pago: formData.pago,
    });
  };

  // --- MUDANÇA: Funções auxiliares para afiliados ---
  const getSelectedTaxistaColetaName = () => taxistas.find(t => t.id.toString() === formData.taxistaColetaId)?.pessoa.nome;
  const getSelectedTaxistaEntregaName = () => taxistas.find(t => t.id.toString() === formData.taxistaEntregaId)?.pessoa.nome;
  const getSelectedComisseiroName = () => comisseiros.find(c => c.id.toString() === formData.comisseiroId)?.pessoa.nome;
  
  const getAffiliatePlaceholder = () => {
    if (loadingAffiliates) return `Carregando...`;
    return `Selecione...`;
  };


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
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

            {/* Comboboxes de Pessoa (Sem alteração) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender">Remetente (Obrigatório)</Label>
                <PessoaSearchCombobox
                  value={formData.senderId}
                  onSelect={(pessoaId) => setFormData({ ...formData, senderId: pessoaId })}
                  onAddNew={() => {
                    setPersonModalTarget('senderId');
                    setIsPersonModalOpen(true);
                  }}
                  onClear={() => setFormData({ ...formData, senderId: null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">Destinatário (Obrigatório)</Label>
                <PessoaSearchCombobox
                  value={formData.recipientId}
                  onSelect={(pessoaId) => setFormData({ ...formData, recipientId: pessoaId })}
                  onAddNew={() => {
                    setPersonModalTarget('recipientId');
                    setIsPersonModalOpen(true);
                  }}
                  onClear={() => setFormData({ ...formData, recipientId: null })}
                />
              </div>
            </div>

            {/* Comboboxes de Endereço (Sem alteração) */}
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
            <div className="space-y-2">
              <Label htmlFor="delivery">Endereço de Entrega (Obrigatório)</Label>
              <AddressSearchCombobox
                value={formData.deliveryAddressId}
                placeholder="Selecione o endereço de entrega..."
                onSelect={(addressId) => setFormData({ ...formData, deliveryAddressId: addressId })}
                onAddNew={() => {
                  setAddressModalTarget('deliveryAddressId');
                  setIsAddressModalOpen(true);
                }}
                onClear={() => setFormData({ ...formData, deliveryAddressId: null })}
              />
            </div>
            
            <hr className="my-4" />

            {/* --- MUDANÇA: Campos de Afiliados --- */}
            <div className="grid grid-cols-2 gap-4">
              {/* Combobox de Taxista (Coleta) */}
              <div className="space-y-2">
                <Label htmlFor="taxistaColeta">Taxista (Coleta)</Label>
                <Popover open={openTaxistaColetaPopover} onOpenChange={setOpenTaxistaColetaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {formData.taxistaColetaId ? getSelectedTaxistaColetaName() : getAffiliatePlaceholder()}
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

              {/* Combobox de Taxista (Entrega) */}
              <div className="space-y-2">
                <Label htmlFor="taxistaEntrega">Taxista (Entrega)</Label>
                <Popover open={openTaxistaEntregaPopover} onOpenChange={setOpenTaxistaEntregaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {formData.taxistaEntregaId ? getSelectedTaxistaEntregaName() : getAffiliatePlaceholder()}
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

            {/* Combobox de Comisseiro (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="comisseiro">Comisseiro (Opcional)</Label>
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
            {/* --- FIM DA MUDANÇA --- */}
            
            {/* Campos de Pagamento (Sem alteração) */}
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
                {pkg ? 'Atualizar' : 'Adicionar'} Encomenda
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