import React, { useState, useEffect } from 'react';
import { Button } from './ui/button'; 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import api from '../services/api';

import { Check, ChevronsUpDown, Pencil } from "lucide-react";
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

// --- INTERFACES ATUALIZADAS ---
interface PersonSaveDto { 
  nome: string; 
  cpf: string; 
  telefones: string[]; // Agora aceita lista de telefones
  idade: number | null; 
}
interface AddressSaveDto { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
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

export default function PassengerModal({ isOpen, onClose, onSave, passenger }: any) {
  const [formData, setFormData] = useState(initialFormData);

  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  const [openTaxistaColetaPopover, setOpenTaxistaColetaPopover] = useState(false);
  const [openTaxistaEntregaPopover, setOpenTaxistaEntregaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  // === ESTADOS QUE ESTAVAM FALTANDO (CORRIGIDO) ===
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Estados para Edição
  const [editingPerson, setEditingPerson] = useState<any | null>(null);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addressModalTarget, setAddressModalTarget] = useState<'pickupAddressId' | 'dropoffAddressId' | null>(null);
  
  // Chave para forçar refresh visual dos comboboxes após edição
  const [refreshKey, setRefreshKey] = useState(0);
  // ================================================

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
    if (!formData.personId) {
        alert("Por favor, selecione o Passageiro.");
        return;
    }
    onSave({
      pessoaId: Number(formData.personId),
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

  // --- LÓGICA DE EDIÇÃO ---

  const handleEditPerson = async () => {
    if (!formData.personId) return;
    try {
        const res = await api.get(`/api/pessoa/${formData.personId}`);
        setEditingPerson(res.data);
        setIsPersonModalOpen(true);
    } catch (e) {
        console.error(e);
        alert("Erro ao carregar dados da pessoa.");
    }
  };

  const handleEditAddress = async (target: 'pickupAddressId' | 'dropoffAddressId') => {
    const addressId = formData[target];
    if (!addressId) return;
    try {
        const res = await api.get(`/api/endereco/${addressId}`);
        setEditingAddress(res.data);
        setAddressModalTarget(target);
        setIsAddressModalOpen(true);
    } catch (e) {
        console.error(e);
        alert("Erro ao carregar endereço.");
    }
  };

  // --- SALVAMENTO (Novo ou Edição) ---

  const handleSavePerson = async (personDto: PersonSaveDto) => {
    try {
      const payload = {
          ...personDto,
          idade: (personDto.idade === null || personDto.idade.toString() === '') ? null : Number(personDto.idade),
          // Backend espera array de telefones
          telefones: personDto.telefones
      };

      let savedPerson;
      if (editingPerson) {
        const response = await api.put(`/api/pessoa/${editingPerson.id}`, payload);
        savedPerson = response.data;
      } else {
        const response = await api.post('/api/pessoa', payload);
        savedPerson = response.data;
      }
      
      setFormData(prev => ({ ...prev, personId: savedPerson.id }));
      setIsPersonModalOpen(false);
      setEditingPerson(null);
      setRefreshKey(prev => prev + 1); 

    } catch (error: any) {
      console.error("Erro ao salvar pessoa:", error);
      const msg = error.response?.data || "Verifique os dados.";
      alert(`Erro ao salvar: ${msg}`);
    }
  };

  const handleSaveAddress = async (addressDto: AddressSaveDto) => {
    try {
      let savedAddress;
      if (editingAddress) {
        const response = await api.put(`/api/endereco/${editingAddress.id}`, addressDto);
        savedAddress = response.data;
      } else {
        const response = await api.post('/api/endereco', addressDto);
        savedAddress = response.data;
      }

      if (addressModalTarget) {
        setFormData(prev => ({ ...prev, [addressModalTarget]: savedAddress.id }));
      }
      setIsAddressModalOpen(false); 
      setAddressModalTarget(null); 
      setEditingAddress(null);
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço.");
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
            <DialogDescription>Selecione ou edite os dados do passageiro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="person">Passageiro (Obrigatório)</Label>
              <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <PessoaSearchCombobox
                        key={`pax-${refreshKey}`}
                        value={formData.personId}
                        onSelect={(pessoaId) => setFormData({ ...formData, personId: pessoaId })}
                        onAddNew={() => {
                            setEditingPerson(null);
                            setIsPersonModalOpen(true);
                        }}
                        onClear={() => setFormData({ ...formData, personId: null })}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0"
                    disabled={!formData.personId}
                    onClick={handleEditPerson}
                    title="Editar dados pessoais"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">Coleta (Opcional)</Label>
                <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                        <AddressSearchCombobox
                            key={`pickup-${refreshKey}`}
                            value={formData.pickupAddressId}
                            placeholder="Endereço de coleta..."
                            onSelect={(addressId) => setFormData({ ...formData, pickupAddressId: addressId })}
                            onAddNew={() => {
                                setEditingAddress(null);
                                setAddressModalTarget('pickupAddressId');
                                setIsAddressModalOpen(true);
                            }}
                            onClear={() => setFormData({ ...formData, pickupAddressId: null })}
                        />
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0"
                        disabled={!formData.pickupAddressId}
                        onClick={() => handleEditAddress('pickupAddressId')}
                        title="Editar endereço"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoff">Entrega (Opcional)</Label>
                <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                        <AddressSearchCombobox
                            key={`dropoff-${refreshKey}`}
                            value={formData.dropoffAddressId}
                            placeholder="Endereço de entrega..."
                            onSelect={(addressId) => setFormData({ ...formData, dropoffAddressId: addressId })}
                            onAddNew={() => {
                                setEditingAddress(null);
                                setAddressModalTarget('dropoffAddressId');
                                setIsAddressModalOpen(true);
                            }}
                            onClear={() => setFormData({ ...formData, dropoffAddressId: null })}
                        />
                    </div>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0"
                        disabled={!formData.dropoffAddressId}
                        onClick={() => handleEditAddress('dropoffAddressId')}
                        title="Editar endereço"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>
            
            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxista (Coleta)</Label>
                <Popover open={openTaxistaColetaPopover} onOpenChange={setOpenTaxistaColetaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal truncate">
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
                <Label>Taxista (Entrega)</Label>
                <Popover open={openTaxistaEntregaPopover} onOpenChange={setOpenTaxistaEntregaPopover} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal truncate">
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
            
            <div className="space-y-2 mt-4">
              <Label>Comisseiro</Label>
              <Popover open={openComisseiroPopover} onOpenChange={setOpenComisseiroPopover} modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal truncate">
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
            
            <div className="grid grid-cols-2 gap-4 mt-4">
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
        onClose={() => {
            setIsPersonModalOpen(false);
            setEditingPerson(null);
        }}
        onSave={handleSavePerson}
        person={editingPerson}
      />
      
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setAddressModalTarget(null);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        address={editingAddress}
      />
    </>
  );
}