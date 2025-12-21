import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft, Car, Users } from 'lucide-react';
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

interface Taxista {
  id: number;
  pessoa: { nome: string; cpf: string; telefone: string };
}

// Funções de formatação blindadas
const formatDateTime = (dateTimeString: string | undefined | null) => {
  if (!dateTimeString) return '-';
  try { return format(new Date(dateTimeString), "dd/MM/yyyy HH:mm", { locale: ptBR }); } 
  catch { return '-'; }
};

const formatBRL = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function TaxistaDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [taxista, setTaxista] = useState<Taxista | null>(null);
  
  // Data padrão: Últimos 90 dias
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 90)),
    to: new Date(),
  });
  
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTaxista, setLoadingTaxista] = useState(true);

  // 1. Carregar Dados do Taxista
  useEffect(() => {
    const fetchTaxista = async () => {
      setLoadingTaxista(true);
      try {
        const res = await api.get(`/api/v1/affiliates/taxistas/${id}`);
        setTaxista(res.data);
      } catch (error) {
        console.error("Aviso: Cadastro do taxista não encontrado (404).", error);
        toast.warning("Cadastro do taxista não encontrado, mas buscaremos o histórico.");
      } finally {
        setLoadingTaxista(false);
      }
    };
    if (id) fetchTaxista();
  }, [id]);

  // 2. Carregar Histórico Financeiro
  useEffect(() => {
    const fetchHistory = async () => {
      if (!id || !date?.from || !date?.to) return;
      setLoading(true);
      try {
        const fromStr = format(date.from, 'yyyy-MM-dd') + 'T00:00:00';
        const toStr = format(date.to, 'yyyy-MM-dd') + 'T23:59:59';

        try {
            const passRes = await api.get(`/api/passageiroviagem/historico/taxista/${id}?inicio=${fromStr}&fim=${toStr}`);
            const data = Array.isArray(passRes.data) ? passRes.data : [];
            setPassengers(data);
        } catch (backendError) {
            console.warn("Endpoint específico falhou, tentando filtro manual no frontend...", backendError);
            
            // FALLBACK: Busca tudo e filtra aqui
            const fallbackRes = await api.get(`/api/passageiroviagem?size=1000&sort=viagem.dataHoraPartida,desc`);
            const allData = fallbackRes.data.content || fallbackRes.data || [];
            
            const taxistaId = Number(id);
            const filtered = allData.filter((p: any) => {
                const isRel = (p.taxistaColeta?.id === taxistaId) || (p.taxistaEntrega?.id === taxistaId);
                if (!isRel || !p.viagem?.dataHoraPartida) return false;
                const d = new Date(p.viagem.dataHoraPartida);
                return d >= (date.from as Date) && d <= (date.to as Date || new Date());
            });
            setPassengers(filtered);
        }

      } catch (error) {
        console.error("Erro fatal ao buscar histórico", error);
        toast.error("Não foi possível carregar as viagens.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, date]);

  // Totais
  const totalPassageiros = passengers.length;

  const displayName = taxista?.pessoa?.nome || `Taxista ID: ${id} (Não encontrado)`;

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
                    <Car className="w-6 h-6 text-orange-600" />
                    {loadingTaxista ? <Skeleton className="h-8 w-48" /> : displayName}
                </h1>
                <p className="text-sm text-slate-500">Histórico de coletas e entregas</p>
            </div>
        </div>

        {/* DATA */}
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

      {/* CARDS (Apenas Total de Passageiros) */}
      <div className="grid grid-cols-1 gap-4"> 
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Passageiros</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-800">{totalPassageiros}</div>
                <p className="text-xs text-slate-500">No período selecionado</p>
            </CardContent>
        </Card>
      </div>

      {/* TABELA */}
      <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" /> Detalhes das Viagens
            </CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : passengers.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Passageiro</TableHead>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Endereço</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {passengers.map(p => {
                            const isColeta = p.taxistaColeta?.id === Number(id);
                            const isEntrega = p.taxistaEntrega?.id === Number(id);
                            const tipos = [];
                            if (isColeta) tipos.push('COLETA');
                            if (isEntrega) tipos.push('ENTREGA');

                            const enderecoShow = isColeta ? p.enderecoColeta : p.enderecoEntrega;
                            const enderecoStr = enderecoShow ? `${enderecoShow.cidade || ''} - ${enderecoShow.bairro || ''}` : '-';

                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{formatDateTime(p.viagem?.dataHoraPartida)}</TableCell>
                                    <TableCell>{p.pessoa.nome}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {tipos.map(t => <Badge key={t} variant="outline" className="text-[10px] border-orange-200 text-orange-700 bg-orange-50">{t}</Badge>)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">{enderecoStr}</TableCell>
                                    <TableCell>{formatBRL(p.valor)}</TableCell>
                                    <TableCell>
                                        <Badge variant={p.pago ? 'default' : 'secondary'} className={p.pago ? 'bg-green-600' : 'bg-slate-200 text-slate-600'}>
                                            {p.pago ? 'Pago' : 'Pendente'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center py-10 text-slate-500">
                    <p>Nenhuma viagem encontrada neste período.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}