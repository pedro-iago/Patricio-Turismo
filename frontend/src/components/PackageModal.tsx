import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
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

// ... (Interfaces mantidas, apenas certifique-se que estão iguais ao original)
interface PersonSaveDto { nome: string; cpf: string; telefone: string | null; idade: number | null; }
interface AddressSaveDto { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Page<T> { content: T[]; }

const initialFormData = {
  description: '',
  senderId: null as number | null,
  recipientId: null as number | null,
  pickupAddressId: null as number | null,
  deliveryAddressId: null as number | null,
  taxistaColetaId: '',
  taxistaEntregaId: '',
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

export default function PackageModal({ isOpen, onClose, onSave, package: pkg }: any) {
  const [formData, setFormData] = useState(initialFormData);

  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  const [openTaxistaColetaPopover, setOpenTaxistaColetaPopover] = useState(false);
  const [openTaxistaEntregaPopover, setOpenTaxistaEntregaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Edição
  const [editingPerson, setEditingPerson] = useState<any | null>(null);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [personModalTarget, setPersonModalTarget] = useState<'senderId' | 'recipientId' | null>(null);
  const [addressModalTarget, setAddressModalTarget] = useState<'pickupAddressId' | 'deliveryAddressId' | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    if (pkg && isOpen) {
      setFormData({
        description: pkg.descricao || '',
        senderId: pkg.remetente?.id || null,
        recipientId: pkg.destinatario?.id || null,
        pickupAddressId: pkg.enderecoColeta?.id || null,
        deliveryAddressId: pkg.enderecoEntrega?.id || null,
        taxistaColetaId: pkg.taxistaColeta?.id?.toString() || '',
        taxistaEntregaId: pkg.taxistaEntrega?.id?.toString() || '',
        comisseiroId: pkg.comisseiro?.id?.toString() || '',
        valor: pkg.valor?.toString() || '',
        metodoPagamento: pkg.metodoPagamento || '',
        pago: pkg.pago || false,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [pkg, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.senderId || !formData.recipientId) {
        alert("Por favor, preencha a Descrição, Remetente e Destinatário.");
        return;
    }

    onSave({
      descricao: formData.description,
      remetenteId: Number(formData.senderId),
      destinatarioId: Number(formData.recipientId),
      enderecoColetaId: formData.pickupAddressId ? Number(formData.pickupAddressId) : undefined,
      enderecoEntregaId: formData.deliveryAddressId ? Number(formData.deliveryAddressId) : undefined,
      taxistaColetaId: formData.taxistaColetaId ? Number(formData.taxistaColetaId) : undefined,
      taxistaEntregaId: formData.taxistaEntregaId ? Number(formData.taxistaEntregaId) : undefined,
      comisseiroId: formData.comisseiroId ? Number(formData.comisseiroId) : undefined,
      valor: formData.valor ? parseFloat(formData.valor) : undefined,
      metodoPagamento: formData.metodoPagamento || undefined,
      pago: formData.pago,
    });
  };

  // --- EDIÇÃO ---
  const handleEditPerson = async (target: 'senderId' | 'recipientId') => {
    const personId = formData[target];
    if (!personId) return;
    try {
        const res = await api.get(`/api/pessoa/${personId}`);
        setEditingPerson(res.data);
        setPersonModalTarget(target);
        setIsPersonModalOpen(true);
    } catch (e) {
        console.error(e);
        alert("Erro ao carregar pessoa.");
    }
  };

  const handleEditAddress = async (target: 'pickupAddressId' | 'deliveryAddressId') => {
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

  // --- SALVAMENTO ---
  const handleSavePerson = async (personDto: PersonSaveDto) => {
    try {
      const payload = {
          ...personDto,
          idade: personDto.idade ? Number(personDto.idade) : null,
          telefone: personDto.telefone || null
      };

      let savedPerson;
      if (editingPerson) {
        const response = await api.put(`/api/pessoa/${editingPerson.id}`, payload);
        savedPerson = response.data;
        alert("Pessoa atualizada!");
      } else {
        const response = await api.post('/api/pessoa', payload);
        savedPerson = response.data;
      }

      if (personModalTarget) {
        setFormData(prev => ({ ...prev, [personModalTarget]: savedPerson.id }));
      }
      setIsPersonModalOpen(false);
      setPersonModalTarget(null);
      setEditingPerson(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao salvar pessoa:", error);
      alert("Erro ao salvar pessoa.");
    }
  };

  const handleSaveAddress = async (addressDto: AddressSaveDto) => {
    try {
      let savedAddress;
      if (editingAddress) {
        const response = await api.put(`/api/endereco/${editingAddress.id}`, addressDto);
        savedAddress = response.data;
        alert("Endereço atualizado!");
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
  const getAffiliatePlaceholder = () => loadingAffiliates ? `Carregando...` : `Selecione...`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{pkg ? 'Editar Encomenda' : 'Adicionar Encomenda'}</DialogTitle>
            <DialogDescription>
              Insira as informações.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Obrigatório)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Caixa de ferramentas"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender">Remetente (Obrigatório)</Label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <PessoaSearchCombobox
                        key={`sender-${refreshKey}`}
                        value={formData.senderId}
                        onSelect={(pessoaId) => setFormData({ ...formData, senderId: pessoaId })}
                        onAddNew={() => {
                            setEditingPerson(null);
                            setPersonModalTarget('senderId');
                            setIsPersonModalOpen(true);
                        }}
                        onClear={() => setFormData({ ...formData, senderId: null })}
                        />
                    </div>
                    <Button type="button" variant="outline" size="icon" disabled={!formData.senderId} onClick={() => handleEditPerson('senderId')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient">Destinatário (Obrigatório)</Label>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <PessoaSearchCombobox
                        key={`recipient-${refreshKey}`}
                        value={formData.recipientId}
                        onSelect={(pessoaId) => setFormData({ ...formData, recipientId: pessoaId })}
                        onAddNew={() => {
                            setEditingPerson(null);
                            setPersonModalTarget('recipientId');
                            setIsPersonModalOpen(true);
                        }}
                        onClear={() => setFormData({ ...formData, recipientId: null })}
                        />
                    </div>
                    <Button type="button" variant="outline" size="icon" disabled={!formData.recipientId} onClick={() => handleEditPerson('recipientId')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup">Endereço de Coleta (Opcional)</Label>
              <div className="flex gap-2">
                  <div className="flex-1">
                    <AddressSearchCombobox
                        key={`pickup-${refreshKey}`}
                        value={formData.pickupAddressId}
                        placeholder="Selecione ou crie..."
                        onSelect={(addressId) => setFormData({ ...formData, pickupAddressId: addressId })}
                        onAddNew={() => {
                            setEditingAddress(null);
                            setAddressModalTarget('pickupAddressId');
                            setIsAddressModalOpen(true);
                        }}
                        onClear={() => setFormData({ ...formData, pickupAddressId: null })}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" disabled={!formData.pickupAddressId} onClick={() => handleEditAddress('pickupAddressId')}>
                        <Pencil className="h-4 w-4" />
                  </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery">Endereço de Entrega (Opcional)</Label>
              <div className="flex gap-2">
                  <div className="flex-1">
                    <AddressSearchCombobox
                        key={`delivery-${refreshKey}`}
                        value={formData.deliveryAddressId}
                        placeholder="Selecione ou crie..."
                        onSelect={(addressId) => setFormData({ ...formData, deliveryAddressId: addressId })}
                        onAddNew={() => {
                            setEditingAddress(null);
                            setAddressModalTarget('deliveryAddressId');
                            setIsAddressModalOpen(true);
                        }}
                        onClear={() => setFormData({ ...formData, deliveryAddressId: null })}
                    />
                  </div>
                  <Button type="button" variant="outline" size="icon" disabled={!formData.deliveryAddressId} onClick={() => handleEditAddress('deliveryAddressId')}>
                        <Pencil className="h-4 w-4" />
                  </Button>
              </div>
            </div>
            
            <hr className="my-4" />

            {/* ... Resto do formulário mantido ... */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Taxista (Coleta)</Label>
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
                    <Label>Taxista (Entrega)</Label>
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

            {/* ... (Comisseiro e Pagamento mantidos) ... */}
            
            <div className="space-y-2 mt-4">
              <Label>Comisseiro</Label>
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
            
            <div className="grid grid-cols-2 gap-4 mt-4">
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
                {pkg ? 'Atualizar' : 'Adicionar'} Encomenda
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