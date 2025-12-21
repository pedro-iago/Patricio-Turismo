import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar'; 
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, User, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from './ui/utils';
import { PessoaSearchCombobox } from './PessoaSearchCombobox'; 
import api from '../services/api';

interface QuickTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onOpenFamilyFlow: (tripId: number) => void; // Callback para abrir o modal de família
}

export default function QuickTicketModal({ isOpen, onClose, onSuccess, onOpenFamilyFlow }: QuickTicketModalProps) {
    const [mode, setMode] = useState<'single' | 'family'>('single');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [pessoaId, setPessoaId] = useState<number | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [tripStatus, setTripStatus] = useState<'existing' | 'new' | null>(null);
    const [foundTrip, setFoundTrip] = useState<any>(null);

    // Resetar ao abrir
    useEffect(() => {
        if (isOpen) {
            setMode('single');
            setDate(new Date());
            setPessoaId(null);
            setTripStatus(null);
            setFoundTrip(null);
        }
    }, [isOpen]);

    // Checar viagem quando a data muda
    useEffect(() => {
        if (date) checkTripExistence(date);
    }, [date]);

    const checkTripExistence = async (selectedDate: Date) => {
        setLoading(true);
        try {
            // Formata para buscar no backend (ajuste o formato se seu backend precisar de outro)
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            // Busca viagens naquele dia (query=dateStr se sua API suportar, ou filtro manual)
            // Assumindo que sua API de listagem aceita um parametro ou retornará tudo e filtramos (menos performático mas funciona)
            // O ideal seria um endpoint: GET /api/viagem?data=...
            
            // Tentativa genérica de busca (adapte para seu endpoint real)
            const response = await api.get(`/api/viagem?query=${dateStr}&size=100`); 
            const content = response.data.content || response.data;
            
            // Filtra no front para garantir (caso a API retorne tudo)
            const viagensDoDia = content.filter((v: any) => v.dataHoraPartida.startsWith(dateStr));

            if (viagensDoDia.length > 0) {
                setTripStatus('existing');
                setFoundTrip(viagensDoDia[0]); // Pega a primeira
            } else {
                setTripStatus('new');
                setFoundTrip(null);
            }
        } catch (error) {
            console.error("Erro ao verificar viagem:", error);
            setTripStatus('new'); // Na dúvida, assume que criará nova
        } finally {
            setLoading(false);
        }
    };

    const getOrCreateTripId = async (): Promise<number | null> => {
        // 1. Se já existe, retorna o ID
        if (tripStatus === 'existing' && foundTrip) return foundTrip.id;
        
        // 2. Se não existe, CRIA AUTOMATICAMENTE
        if (date) {
            try {
                // Lógica de Rota baseada no Dia da Semana
                const dayOfWeek = date.getDay(); 
                // Exemplo: 4 (Quinta) = Ida, 6 (Sábado) = Volta. Ajuste conforme sua realidade.
                const isIda = dayOfWeek === 4; 
                
                // Hora padrão: Saída 12:00
                const dataPartida = new Date(date);
                dataPartida.setHours(12, 0, 0, 0);
                
                // Chegada estimada (ex: +2 dias)
                const dataChegada = new Date(dataPartida);
                dataChegada.setDate(dataChegada.getDate() + 2);

                const novaViagemPayload = {
                    dataHoraPartida: dataPartida.toISOString(), // Backend espera ISO
                    dataHoraChegada: dataChegada.toISOString(),
                    onibusIds: [] // Sem ônibus definido
                };
                
                const res = await api.post('/api/viagem', novaViagemPayload);
                return res.data.id;
            } catch (e) {
                console.error(e);
                toast.error("Erro ao criar viagem automática. Verifique o console.");
                return null;
            }
        }
        return null;
    };

    const handleConfirm = async () => {
        if (!date) return;
        setLoading(true);
        
        try {
            // 1. Obtém ID da Viagem (Encontra ou Cria)
            const tripId = await getOrCreateTripId();
            
            if (!tripId) { 
                setLoading(false); 
                return; 
            }

            // 2. Fluxo FAMÍLIA
            if (mode === 'family') {
                // Fecha este modal e pede pro Pai abrir o modal de Família com o ID correto
                onOpenFamilyFlow(tripId);
                return; 
            }

            // 3. Fluxo INDIVIDUAL
            if (!pessoaId) {
                toast.warning("Selecione um passageiro.");
                setLoading(false);
                return;
            }

            const ticketPayload = {
                viagemId: tripId,
                pessoaId: pessoaId,
                valor: 450.00, // Valor padrão ou buscar de config
                pago: false
            };

            await api.post('/api/passageiroviagem', ticketPayload);
            
            toast.success("Venda realizada com sucesso!");
            onSuccess(); // Recarrega a lista de viagens
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar venda.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 p-1 rounded"><Users className="w-5 h-5"/></span>
                        Venda Rápida
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    
                    {/* SELEÇÃO DE MODO */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
                        <button 
                            onClick={() => setMode('single')}
                            className={cn("flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-md text-sm font-medium transition-all border", mode === 'single' ? "bg-white text-orange-600 shadow-sm border-orange-200" : "border-transparent text-slate-500 hover:text-slate-700")}
                        >
                            <User className="w-5 h-5" />
                            Individual
                        </button>
                        <button 
                            onClick={() => setMode('family')}
                            className={cn("flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-md text-sm font-medium transition-all border", mode === 'family' ? "bg-white text-indigo-600 shadow-sm border-indigo-200" : "border-transparent text-slate-500 hover:text-slate-700")}
                        >
                            <Users className="w-5 h-5" />
                            Grupo / Família
                        </button>
                    </div>

                    {/* DATA (Sempre visível) */}
                    <div className="space-y-2">
                        <Label>Data da Saída</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal text-base h-11 border-slate-300", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                    {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : <span>Selecione a data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>

                        {/* Status da Viagem */}
                        <div className="min-h-[20px] text-xs mt-1">
                            {loading ? (
                                <span className="text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Verificando agenda...</span>
                            ) : tripStatus === 'existing' ? (
                                <span className="text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-1 rounded w-fit border border-green-100">
                                    <CheckCircle2 className="w-3 h-3"/> Viagem existente encontrada (#{foundTrip.id})
                                </span>
                            ) : (
                                <span className="text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-100">
                                    <AlertCircle className="w-3 h-3"/> Será criada uma nova viagem
                                </span>
                            )}
                        </div>
                    </div>

                    {/* SELEÇÃO DE PESSOA (Apenas se for Individual) */}
                    {mode === 'single' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label>Passageiro</Label>
                            <PessoaSearchCombobox 
                                value={pessoaId}
                                onSelect={setPessoaId} 
                                placeholder="Pesquise quem vai viajar..."
                            />
                        </div>
                    )}
                    
                    {/* AVISO SE FOR FAMÍLIA */}
                    {mode === 'family' && (
                        <div className="p-4 bg-indigo-50 text-indigo-700 text-sm rounded border border-indigo-100 animate-in fade-in flex gap-3 items-start">
                            <Users className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <strong>Modo Grupo Familiar:</strong><br/>
                                Ao continuar, abriremos a tela completa de cadastro de família já vinculada a esta data.
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={loading || !date || (mode === 'single' && !pessoaId)}
                        className={cn("w-full sm:w-auto text-white shadow-md", mode === 'family' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-orange-500 hover:bg-orange-600")}
                    >
                        {loading ? 'Processando...' : (mode === 'family' ? 'Continuar para Família' : 'Confirmar Venda')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}