import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, X, MapPin, DollarSign, User, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from './ui/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

import api from '../services/api';
import { AddressSearchCombobox } from './AddressSearchCombobox';
import { PessoaSearchCombobox } from './PessoaSearchCombobox';
import PersonModal from './PersonModal';
import AddressModal from './AddressModal'; // <--- IMPORTADO

// --- TIPAGEM ---
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Page<T> { content: T[]; }
// Interface para salvar endereço (igual ao PassengerModal)
interface AddressSaveDto { logradouro: string; numero: string; bairro: string; cidade: string; estado: string; cep: string; }

// Dados do Formulário
interface FamilyFormData {
  valorIndividual: string;
  enderecoColeta: any;
  enderecoEntrega: any;
  taxistaColetaId: string;
  taxistaEntregaId: string;
  comisseiroId: string;
  membros: {
    passageiroViagemId?: number | null; 
    pessoaId: number | null;
    nome: string;
    cpf: string;
    telefone: string;
    numeroAssento: string;
  }[];
}

interface FamilyPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  tripId: string;
  initialData?: any; 
}

export default function FamilyPassengerModal({ isOpen, onClose, onSaveSuccess, tripId, initialData }: FamilyPassengerModalProps) {
  
  // --- ESTADOS ---
  const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
  const [comisseiros, setComisseiros] = useState<Affiliate[]>([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);

  const { control, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<FamilyFormData>({
    defaultValues: {
      valorIndividual: '450',
      enderecoColeta: null,
      enderecoEntrega: null,
      taxistaColetaId: '',
      taxistaEntregaId: '',
      comisseiroId: '',
      membros: [{ passageiroViagemId: null, pessoaId: null, nome: '', cpf: '', telefone: '', numeroAssento: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "membros"
  });

  // --- ESTADOS DE MODAIS ---
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [targetMemberIndex, setTargetMemberIndex] = useState<number | null>(null);

  // Novos estados para o Modal de Endereço (IGUAL AO PASSENGER MODAL)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalTarget, setAddressModalTarget] = useState<'enderecoColeta' | 'enderecoEntrega' | null>(null);

  // --- CARREGAR DADOS ---
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
          toast.error("Erro ao carregar lista de afiliados.");
        }
        setLoadingAffiliates(false);
      };
      fetchAffiliates();

      if (initialData && initialData.items && initialData.items.length > 0) {
          const firstPax = initialData.items[0].dadosCompletos;
          reset({
              valorIndividual: firstPax.valor ? String(firstPax.valor) : '0',
              enderecoColeta: firstPax.enderecoColeta ? firstPax.enderecoColeta.id : null,
              enderecoEntrega: firstPax.enderecoEntrega ? firstPax.enderecoEntrega.id : null,
              taxistaColetaId: firstPax.taxistaColeta ? String(firstPax.taxistaColeta.id) : '',
              taxistaEntregaId: firstPax.taxistaEntrega ? String(firstPax.taxistaEntrega.id) : '',
              comisseiroId: firstPax.comisseiro ? String(firstPax.comisseiro.id) : '',
              membros: initialData.items.map((item: any) => ({
                  passageiroViagemId: item.dadosCompletos.id, 
                  pessoaId: item.dadosCompletos.pessoa.id,
                  nome: item.dadosCompletos.pessoa.nome,
                  cpf: item.dadosCompletos.pessoa.cpf || '',
                  telefone: item.dadosCompletos.pessoa.telefone || '',
                  numeroAssento: item.dadosCompletos.numeroAssento || ''
              }))
          });
      } else {
          reset({
            valorIndividual: '450',
            enderecoColeta: null,
            enderecoEntrega: null,
            taxistaColetaId: '',
            taxistaEntregaId: '',
            comisseiroId: '',
            membros: [{ passageiroViagemId: null, pessoaId: null, nome: '', cpf: '', telefone: '', numeroAssento: '' }]
          });
      }
    }
  }, [isOpen, reset, initialData]);

  // --- HANDLERS PESSOA ---
  const handleSelectPerson = async (index: number, pessoaId: number) => {
    setValue(`membros.${index}.pessoaId`, pessoaId);
    try {
      const res = await api.get(`/api/pessoa/${pessoaId}`);
      const p = res.data;
      setValue(`membros.${index}.nome`, p.nome);
      setValue(`membros.${index}.cpf`, p.cpf || '');
      if (p.telefones && p.telefones.length > 0) setValue(`membros.${index}.telefone`, p.telefones[0]);
      else if (p.telefone) setValue(`membros.${index}.telefone`, p.telefone);
    } catch (error) { console.error(error); }
  };

  const handleSaveNewPerson = async (personDto: any) => {
    try {
        const payload = { ...personDto, idade: personDto.idade ? Number(personDto.idade) : null };
        const res = await api.post('/api/pessoa', payload);
        const novaPessoa = res.data;
        if (targetMemberIndex !== null) handleSelectPerson(targetMemberIndex, novaPessoa.id);
        setIsPersonModalOpen(false);
        toast.success("Pessoa criada!");
    } catch (error) { toast.error("Erro ao criar pessoa."); }
  };

  // --- HANDLER ENDEREÇO (NOVO) ---
  const handleSaveAddress = async (addressDto: AddressSaveDto) => {
    try {
        // Sempre cria novo aqui para simplificar, já que é modal de cadastro rápido
        const response = await api.post('/api/endereco', addressDto);
        const savedAddress = response.data;

        if (addressModalTarget) {
            // Atualiza o valor no React Hook Form
            setValue(addressModalTarget, savedAddress.id);
        }
        
        setIsAddressModalOpen(false);
        setAddressModalTarget(null);
        toast.success("Endereço cadastrado!");
    } catch (error) {
        console.error("Erro ao salvar endereço:", error);
        toast.error("Erro ao salvar endereço.");
    }
  };

  const onSubmit = async (data: FamilyFormData) => {
    const validMembers = data.membros.filter(m => m.pessoaId || m.nome.trim().length > 0);
    if (validMembers.length === 0) { toast.warning("Adicione pelo menos um passageiro."); return; }
    try {
      const valorString = data.valorIndividual ? String(data.valorIndividual) : '0';
      const valorFinal = parseFloat(valorString.replace(',', '.')) || 0;
      const payload = {
        viagemId: Number(tripId),
        taxistaColetaId: data.taxistaColetaId ? Number(data.taxistaColetaId) : null,
        taxistaEntregaId: data.taxistaEntregaId ? Number(data.taxistaEntregaId) : null,
        comisseiroId: data.comisseiroId ? Number(data.comisseiroId) : null,
        enderecoColeta: data.enderecoColeta ? { id: Number(data.enderecoColeta) } : null,
        enderecoEntrega: data.enderecoEntrega ? { id: Number(data.enderecoEntrega) } : null,
        valorIndividual: valorFinal,
        membros: validMembers.map(m => ({
            id: m.passageiroViagemId || null, 
            pessoaId: m.pessoaId,
            nome: m.nome,
            cpf: m.cpf,
            telefone: m.telefone, 
            numeroAssento: m.numeroAssento
        }))
      };
      await api.post('/api/passageiroviagem/grupo', payload);
      toast.success(initialData ? "Grupo atualizado!" : "Grupo criado com sucesso!");
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data || 'Erro ao salvar grupo.'; // Ajustei para pegar string direta se vier
      toast.error(typeof msg === 'string' ? msg : 'Erro desconhecido');
    }
  };

  // --- SELECT COMPONENT ---
  const AffiliateSelect = ({ value, onChange, options, placeholder }: any) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find((opt:any) => opt.id.toString() === value)?.pessoa.nome;
    return (
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal bg-background h-9">
            {value ? <span className="truncate">{selectedLabel}</span> : <span className="text-muted-foreground">{loadingAffiliates ? "Carregando..." : placeholder}</span>}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Pesquisar..." />
            <CommandList>
              <CommandEmpty>Nenhum encontrado.</CommandEmpty>
              <CommandGroup>
                 <CommandItem value="nenhum" onSelect={() => { onChange(''); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", value === '' ? "opacity-100" : "opacity-0")} />Nenhum</CommandItem>
                {options.map((option:any) => (
                  <CommandItem key={option.id} value={option.pessoa.nome} onSelect={() => { onChange(option.id.toString()); setOpen(false); }}>
                    <Check className={cn("mr-2 h-4 w-4", value === option.id.toString() ? "opacity-100" : "opacity-0")} />{option.pessoa.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
        
        {/* HEADER */}
        <DialogHeader className="px-6 py-5 border-b flex flex-row items-center justify-between space-y-0 bg-slate-50/50 shrink-0">
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
                {initialData ? "Editar Grupo Familiar" : "Novo Grupo Familiar"}
            </DialogTitle>
            <DialogDescription className="mt-1">
                Configure a logística e selecione os passageiros.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. ROTA E LOGÍSTICA */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Rota e Logística</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Endereço de Coleta</Label>
                        <Controller
                            name="enderecoColeta"
                            control={control}
                            render={({ field }) => (
                                <AddressSearchCombobox 
                                    value={field.value} 
                                    onSelect={field.onChange} 
                                    placeholder="Buscar origem..."
                                    // ✅ CONECTADO O MODAL DE ENDEREÇO
                                    onAddNew={() => {
                                        setAddressModalTarget('enderecoColeta');
                                        setIsAddressModalOpen(true);
                                    }}
                                />
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Endereço de Entrega</Label>
                        <Controller
                            name="enderecoEntrega"
                            control={control}
                            render={({ field }) => (
                                <AddressSearchCombobox 
                                    value={field.value} 
                                    onSelect={field.onChange} 
                                    placeholder="Buscar destino..."
                                    // ✅ CONECTADO O MODAL DE ENDEREÇO
                                    onAddNew={() => {
                                        setAddressModalTarget('enderecoEntrega');
                                        setIsAddressModalOpen(true);
                                    }}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Taxista Coleta</Label>
                        <Controller name="taxistaColetaId" control={control} render={({ field }) => (<AffiliateSelect value={field.value} onChange={field.onChange} options={taxistas} placeholder="Selecione..." />)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Taxista Entrega</Label>
                        <Controller name="taxistaEntregaId" control={control} render={({ field }) => (<AffiliateSelect value={field.value} onChange={field.onChange} options={taxistas} placeholder="Selecione..." />)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Comisseiro</Label>
                        <Controller name="comisseiroId" control={control} render={({ field }) => (<AffiliateSelect value={field.value} onChange={field.onChange} options={comisseiros} placeholder="Selecione..." />)} />
                    </div>
                </div>
            </section>

            {/* 2. LISTA DE PASSAGEIROS */}
            <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Passageiros ({fields.length})</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-100 rounded-md px-2 py-1 border">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-medium text-slate-500 mr-1">Valor Unitário:</span>
                        <div className="relative w-20">
                            <Controller
                                control={control}
                                name="valorIndividual"
                                render={({ field }) => (
                                    <Input 
                                        {...field}
                                        className="h-6 text-xs pl-1 border-transparent bg-transparent shadow-none hover:bg-white focus:bg-white focus:border-input text-right font-bold text-slate-900 p-0 rounded-sm" 
                                        placeholder="0"
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-all group">
                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute top-2 right-2 bg-white text-slate-400 hover:text-red-500 border rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}

                            {/* Nome (Busca) */}
                            <div className="flex-1 space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                    Passageiro {index + 1}
                                </Label>
                                <Controller
                                    control={control}
                                    name={`membros.${index}.pessoaId`}
                                    render={({ field: selectField }) => (
                                        <div className="relative">
                                                <PessoaSearchCombobox 
                                                value={selectField.value}
                                                onSelect={(id) => handleSelectPerson(index, id)}
                                                onAddNew={() => { setTargetMemberIndex(index); setIsPersonModalOpen(true); }}
                                                placeholder="Pesquise o nome do passageiro..."
                                                className="h-10 text-sm"
                                            />
                                        </div>
                                    )}
                                />
                                
                                <Controller name={`membros.${index}.telefone`} control={control} render={({ field }) => <input type="hidden" {...field} />} />
                                <Controller name={`membros.${index}.cpf`} control={control} render={({ field }) => <input type="hidden" {...field} />} />
                                <Controller name={`membros.${index}.numeroAssento`} control={control} render={({ field }) => <input type="hidden" {...field} />} />
                            </div>
                        </div>
                    ))}

                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => append({ passageiroViagemId: null, pessoaId: null, nome: '', cpf: '', telefone: '', numeroAssento: '' })}
                        className="w-full border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 h-12"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Passageiro
                    </Button>
                </div>
            </section>

        </div>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50 shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? 'Salvando...' : 'Salvar Grupo'}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>

    <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSaveNewPerson}
        person={null}
    />

    {/* ✅ MODAL DE ENDEREÇO ADICIONADO AQUI */}
    <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setAddressModalTarget(null);
        }}
        onSave={handleSaveAddress}
        address={null} // Sempre null pois é cadastro rápido
    />
    </>
  );
}