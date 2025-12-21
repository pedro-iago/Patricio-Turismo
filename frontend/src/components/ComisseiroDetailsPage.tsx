import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, UserCheck, Package, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import api from '../services/api';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { cn } from './ui/utils';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface Comisseiro {
  id: number;
  pessoa: { nome: string; cpf: string; telefone: string };
}

const formatDateTime = (dateTimeString: string | undefined | null) => {
  if (!dateTimeString) return '-';
  try { return format(new Date(dateTimeString), "dd/MM/yyyy HH:mm", { locale: ptBR }); } 
  catch { return '-'; }
};

const formatBRL = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function ComisseiroDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [comisseiro, setComisseiro] = useState<Comisseiro | null>(null);
  
  // Data padrão: Últimos 90 dias
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 90)),
    to: new Date(),
  });
  
  const [passengers, setPassengers] = useState<any[]>([]);
  const [encomendas, setEncomendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComisseiro, setLoadingComisseiro] = useState(true);

  // 1. Carregar Comisseiro
  useEffect(() => {
    const fetchComisseiro = async () => {
      setLoadingComisseiro(true);
      try {
        const res = await api.get(`/api/v1/affiliates/comisseiros/${id}`);
        setComisseiro(res.data);
      } catch (error) {
        console.warn("Comisseiro não encontrado. Exibindo apenas histórico.");
        toast.warning("Cadastro não encontrado, buscando histórico...");
      } finally {
        setLoadingComisseiro(false);
      }
    };
    if (id) fetchComisseiro();
  }, [id]);

  // 2. Carregar Histórico
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || !date?.from || !date?.to) return;
      setLoading(true);
      try {
        const comisseiroId = Number(id);
        const fromStr = format(date.from, 'yyyy-MM-dd') + 'T00:00:00';
        const toStr = format(date.to, 'yyyy-MM-dd') + 'T23:59:59';

        // Tenta endpoint específico
        try {
            const [passRes, encRes] = await Promise.all([
                api.get(`/api/passageiroviagem/historico/comisseiro/${id}?inicio=${fromStr}&fim=${toStr}`),
                // Se não tiver endpoint de histórico de encomenda específico, usa o genérico filtrado
                api.get(`/api/encomenda?size=2000`) 
            ]);
            
            // Passageiros (vem direto se o endpoint funcionar)
            const pData = Array.isArray(passRes.data) ? passRes.data : [];
            setPassengers(pData);

            // Encomendas (filtro manual pois não criamos endpoint especifico de historico de encomenda ainda)
            const eData = encRes.data.content || encRes.data || [];
            const dataInicio = date.from;
            const dataFim = date.to || new Date();
            dataFim.setHours(23, 59, 59);

            const filteredEnc = eData.filter((e: any) => {
                if (e.comisseiro?.id !== comisseiroId) return false;
                if (!e.viagem?.dataHoraPartida) return false;
                const d = new Date(e.viagem.dataHoraPartida);
                return d >= dataInicio && d <= dataFim;
            });
            setEncomendas(filteredEnc);

        } catch (backendError) {
            console.warn("Endpoint específico falhou, tentando fallback geral...", backendError);
            
            // FALLBACK: Busca TUDO e filtra no front
            const [passRes, encRes] = await Promise.all([
                api.get(`/api/passageiroviagem?size=2000`), // Remove o sort se o backend não suportar
                api.get(`/api/encomenda?size=2000`)
            ]);

            const allPass = passRes.data.content || passRes.data || [];
            const allEnc = encRes.data.content || encRes.data || [];
            
            const dataInicio = date.from;
            const dataFim = date.to || new Date();
            dataFim.setHours(23, 59, 59);

            setPassengers(allPass.filter((p: any) => {
                if (p.comisseiro?.id !== comisseiroId) return false;
                if (!p.viagem?.dataHoraPartida) return false;
                const d = new Date(p.viagem.dataHoraPartida);
                return d >= dataInicio && d <= dataFim;
            }));

            setEncomendas(allEnc.filter((e: any) => {
                if (e.comisseiro?.id !== comisseiroId) return false;
                if (!e.viagem?.dataHoraPartida) return false;
                const d = new Date(e.viagem.dataHoraPartida);
                return d >= dataInicio && d <= dataFim;
            }));
        }

      } catch (error) {
        console.error("Erro fatal ao carregar histórico", error);
        toast.error("Erro ao carregar movimentações.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, date]);

  const totalPassageiros = passengers.length;
  const totalEncomendas = encomendas.length;
  const displayName = comisseiro?.pessoa?.nome || `Comisseiro ID: ${id}`;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-orange-600" />
                    {loadingComisseiro ? <Skeleton className="h-8 w-48" /> : displayName}
                </h1>
                <p className="text-sm text-slate-500">Relatório de comissões e indicações</p>
            </div>
        </div>

        {/* DATE PICKER */}
        <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal bg-white", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? <>{format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}</> : format(date.from, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione o período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} />
              </PopoverContent>
            </Popover>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Passageiros Indicados</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-800">{totalPassageiros}</div>
                <p className="text-xs text-slate-500">No período selecionado</p>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Encomendas Indicadas</CardTitle>
                <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-800">{totalEncomendas}</div>
                <p className="text-xs text-slate-500">No período selecionado</p>
            </CardContent>
        </Card>
      </div>

      {/* HISTÓRICO DE PASSAGEIROS */}
      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" /> Histórico de Indicações (Passageiros)
            </CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : passengers.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data Viagem</TableHead>
                            <TableHead>Passageiro</TableHead>
                            <TableHead>Destino/Origem</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {passengers.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{formatDateTime(p.viagem?.dataHoraPartida)}</TableCell>
                                <TableCell>{p.pessoa.nome}</TableCell>
                                <TableCell className="text-xs text-slate-500">
                                    {p.enderecoColeta?.cidade || '?'} ➔ {p.enderecoEntrega?.cidade || '?'}
                                </TableCell>
                                <TableCell>{formatBRL(p.valor)}</TableCell>
                                <TableCell>
                                    <Badge variant={p.pago ? 'default' : 'secondary'} className={p.pago ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-200 text-slate-600'}>
                                        {p.pago ? 'Pago' : 'Pendente'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado para este comisseiro neste período.
                </div>
            )}
        </CardContent>
      </Card>

      {/* HISTÓRICO DE ENCOMENDAS */}
      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" /> Histórico de Indicações (Encomendas)
            </CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-2"><Skeleton className="h-10 w-full" /></div>
            ) : encomendas.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data Viagem</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {encomendas.map(e => (
                            <TableRow key={e.id}>
                                <TableCell className="font-medium">{formatDateTime(e.viagem?.dataHoraPartida)}</TableCell>
                                <TableCell>{e.descricao}</TableCell>
                                <TableCell>{formatBRL(e.valor)}</TableCell>
                                <TableCell>
                                    <Badge variant={e.pago ? 'default' : 'secondary'} className={e.pago ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-200 text-slate-600'}>
                                        {e.pago ? 'Pago' : 'Pendente'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-8 text-slate-500">Nenhuma encomenda encontrada.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}