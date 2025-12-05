import React, { useState, useEffect } from 'react';
import { Button } from './ui/button'; 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import api from '../services/api';

import { Check, ChevronsUpDown, Pencil, X } from "lucide-react";
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

// --- INTERFACES ---
interface PersonSaveDto { nome: string; cpf: string; telefone: string | null; idade: number | null; }
interface AddressSaveDto { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Page<T> { content: T[]; }

// Dados iniciais do formulário
const initialFormData = {
  descricao: '',
  remetenteId: null as number | null,
  destinatarioId: null as number | null,
  pickupAddressId: null as number | null,
  dropoffAddressId: null as number | null,
  taxistaColetaId: '',
  taxistaEntregaId: '',
  comisseiroId: '',
  valor: '',
  metodoPagamento: '',
  pago: false,
};

interface PackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    pkg?: any; // Objeto da encomenda se for edição
}

export default function PackageModal({ isOpen, onClose, onSave, pkg }: PackageModalProps) {
  const [formData, setFormData] = useState(initialFormData);

  // Estados de Afiliados
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  // Popovers de Afiliados
  const [openTaxistaColetaPopover, setOpenTaxistaColetaPopover] = useState(false);
  const [openTaxistaEntregaPopover, setOpenTaxistaEntregaPopover] = useState(false);
  const [openComisseiroPopover, setOpenComisseiroPopover] = useState(false);

  // Controle dos Modais Filhos (Pessoa e Endereço)
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  
  // Estados para Edição e Alvo
  const [editingPerson, setEditingPerson] = useState<any | null>(null);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  
  // Define qual campo está sendo editado/criado ('remetente' ou 'destinatario')
  const [personModalTarget, setPersonModalTarget] = useState<'remetenteId' | 'destinatarioId' | null>(null);
  // Define qual endereço está sendo editado/criado
  const [addressModalTarget, setAddressModalTarget] = useState<'pickupAddressId' | 'dropoffAddressId' | null>(null);
  
  // Chave para forçar refresh visual dos comboboxes após edição
  const [refreshKey, setRefreshKey] = useState(0);

  // --- 1. CARREGAR AFILIADOS ---
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

  // --- 2. PREENCHER FORMULÁRIO NA EDIÇÃO ---
  useEffect(() => {
    if (pkg && isOpen) {
      setFormData({
        descricao: pkg.descricao || '',
        remetenteId: pkg.remetente?.id || null,
        destinatarioId: pkg.destinatario?.id || null,
        pickupAddressId: pkg.enderecoColeta?.id || null, 
        dropoffAddressId: pkg.enderecoEntrega?.id || null,
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

  // --- SUBMIT PRINCIPAL ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao) { alert("Descrição é obrigatória."); return; }
    if (!formData.remetenteId) { alert("Remetente é obrigatório."); return; }
    if (!formData.destinatarioId) { alert("Destinatário é obrigatório."); return; }

    onSave({
      descricao: formData.descricao,
      remetenteId: Number(formData.remetenteId),
      destinatarioId: Number(formData.destinatarioId),
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

  // --- LÓGICA DE ABERTURA DE MODAIS DE EDIÇÃO ---

  const handleEditPerson = async (target: 'remetenteId' | 'destinatarioId') => {
    const personId = formData[target];
    if (!personId) return;
    try {
        const res = await api.get(`/api/pessoa/${personId}`);
        setEditingPerson(res.data);
        setPersonModalTarget(target);
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

  // --- SALVAMENTO DOS MODAIS FILHOS ---

  const handleSavePerson = async (personDto: PersonSaveDto) => {
    try {
      const payload = {
          ...personDto,
          idade: (personDto.idade === null || personDto.idade.toString() === '') ? null : Number(personDto.idade),
          telefone: (personDto.telefone === '' || personDto.telefone === null) ? null : personDto.telefone
      };

      let savedPerson;
      if (editingPerson) {
        const response = await api.put(`/api/pessoa/${editingPerson.id}`, payload);
        savedPerson = response.data;
      } else {
        const response = await api.post('/api/pessoa', payload);
        savedPerson = response.data;
      }
      
      // Atualiza o campo correto (Remetente ou Destinatário)
      if (personModalTarget) {
          setFormData(prev => ({ ...prev, [personModalTarget]: savedPerson.id }));
      }

      setIsPersonModalOpen(false);
      setEditingPerson(null);
      setPersonModalTarget(null);
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"> 
          <DialogHeader>
            <DialogTitle>{pkg ? 'Editar Encomenda' : 'Nova Encomenda'}</DialogTitle>
            <DialogDescription>Insira os dados da encomenda.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* DESCRIÇÃO */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Obrigatório)</Label>
              <Input
                  id="descricao"
                  placeholder="Ex: Caixa de ferramentas, Envelope..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
              />
            </div>

            {/* REMETENTE E DESTINATÁRIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Remetente (Obrigatório)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                            <PessoaSearchCombobox
                                key={`remetente-${refreshKey}`}
                                value={formData.remetenteId}
                                placeholder="Pesquisar remetente..."
                                onSelect={(id) => setFormData({ ...formData, remetenteId: id })}
                                onAddNew={() => {
                                    setEditingPerson(null);
                                    setPersonModalTarget('remetenteId');
                                    setIsPersonModalOpen(true);
                                }}
                                onClear={() => setFormData({ ...formData, remetenteId: null })}
                            />
                        </div>
                        <Button 
                            type="button" variant="outline" size="icon" className="shrink-0"
                            disabled={!formData.remetenteId}
                            onClick={() => handleEditPerson('remetenteId')}
                            title="Editar Remetente"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Destinatário (Obrigatório)</Label>
                    <div className="flex gap-2">
                        <div className="flex-1 min-w-0">
                            <PessoaSearchCombobox
                                key={`destinatario-${refreshKey}`}
                                value={formData.destinatarioId}
                                placeholder="Pesquisar destinatário..."
                                onSelect={(id) => setFormData({ ...formData, destinatarioId: id })}
                                onAddNew={() => {
                                    setEditingPerson(null);
                                    setPersonModalTarget('destinatarioId');
                                    setIsPersonModalOpen(true);
                                }}
                                onClear={() => setFormData({ ...formData, destinatarioId: null })}
                            />
                        </div>
                        <Button 
                            type="button" variant="outline" size="icon" className="shrink-0"
                            disabled={!formData.destinatarioId}
                            onClick={() => handleEditPerson('destinatarioId')}
                            title="Editar Destinatário"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ENDEREÇOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">Endereço Coleta (Opcional)</Label>
                <div className="flex gap-2">
                    <div className="flex-1 min-w-0"> 
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
                    <Button 
                        type="button" variant="outline" size="icon" className="shrink-0"
                        disabled={!formData.pickupAddressId}
                        onClick={() => handleEditAddress('pickupAddressId')}
                        title="Editar endereço"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dropoff">Endereço Entrega (Opcional)</Label>
                <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                        <AddressSearchCombobox
                            key={`dropoff-${refreshKey}`}
                            value={formData.dropoffAddressId}
                            placeholder="Selecione ou crie..."
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
                        type="button" variant="outline" size="icon" className="shrink-0"
                        disabled={!formData.dropoffAddressId}
                        onClick={() => handleEditAddress('dropoffAddressId')}
                        title="Editar endereço"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>
            
            <hr className="my-2 border-gray-100" />

            {/* AFILIADOS - AGORA COM OPÇÃO DE LIMPAR */}
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
                          {/* OPÇÃO PARA LIMPAR */}
                          <CommandItem 
                            value="nenhum" 
                            onSelect={() => {
                                setFormData({ ...formData, taxistaColetaId: '' });
                                setOpenTaxistaColetaPopover(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.taxistaColetaId === '' ? "opacity-100" : "opacity-0")} />
                            Nenhum (Limpar)
                          </CommandItem>

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
                          {/* OPÇÃO PARA LIMPAR */}
                          <CommandItem 
                            value="nenhum" 
                            onSelect={() => {
                                setFormData({ ...formData, taxistaEntregaId: '' });
                                setOpenTaxistaEntregaPopover(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.taxistaEntregaId === '' ? "opacity-100" : "opacity-0")} />
                            Nenhum (Limpar)
                          </CommandItem>

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
                        {/* OPÇÃO PARA LIMPAR */}
                        <CommandItem 
                            value="nenhum" 
                            onSelect={() => {
                                setFormData({ ...formData, comisseiroId: '' });
                                setOpenComisseiroPopover(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.comisseiroId === '' ? "opacity-100" : "opacity-0")} />
                            Nenhum (Limpar)
                          </CommandItem>

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
            
            {/* VALORES E PAGAMENTO */}
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
              <Label htmlFor="pago" className="font-medium cursor-pointer">
                Pagamento Efetuado?
              </Label>
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {pkg ? 'Atualizar Encomenda' : 'Adicionar Encomenda'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PESSOA (REUTILIZÁVEL) */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => {
            setIsPersonModalOpen(false);
            setEditingPerson(null);
            setPersonModalTarget(null);
        }}
        onSave={handleSavePerson}
        person={editingPerson}
      />
      
      {/* MODAL DE ENDEREÇO (REUTILIZÁVEL) */}
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