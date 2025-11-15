import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { getTaxistaPassageirosReport, getTaxistaEncomendasReport } from '../services/api';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
// ✅ 1. IMPORTE OS COMPONENTES DE CARD (JÁ EXISTIAM)
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { cn } from './ui/utils';

// ... (Interfaces, formatDateTime, formatBRL - SEM ALTERAÇÃO) ...
interface PassageiroReport {
  id: string;
  pessoa: { nome: string; cpf: string; };
  viagem?: { dataHoraPartida: string; };
  valor?: number;
  pago?: boolean;
}
interface EncomendaReport {
  id: string;
  descricao: string;
  viagem?: { dataHoraPartida: string; };
  valor?: number;
  pago?: boolean;
}
const formatDateTime = (dateTimeString: string | undefined) => {
  if (!dateTimeString) return 'N/A';
  return new Date(dateTimeString).toLocaleString('pt-BR');
};
const formatBRL = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};


const TaxistaDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    return { from: inicio, to: fim };
  });
  const [passageiros, setPassageiros] = useState<PassageiroReport[]>([]);
  const [encomendas, setEncomendas] = useState<EncomendaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... (useEffect de fetch - SEM ALTERAÇÃO) ...
  useEffect(() => {
    if (!id || !date?.from || !date?.to) return;
    const inicio = format(date.from, 'yyyy-MM-dd') + 'T00:00:00';
    const fim = format(date.to, 'yyyy-MM-dd') + 'T23:59:59';
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [passageirosData, encomendasData] = await Promise.all([
          getTaxistaPassageirosReport(id, inicio, fim),
          getTaxistaEncomendasReport(id, inicio, fim),
        ]);
        setPassageiros(passageirosData);
        setEncomendas(encomendasData);
      } catch (err) {
        console.error('Erro ao buscar relatórios:', err);
        setError('Não foi possível carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, date]);


  return (
    <div className="space-y-6">
      {/* ... (Cabeçalho e DatePicker - SEM ALTERAÇÃO) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/affiliates')}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-semibold">Relatório do Taxista</h2>
              <p className="text-muted-foreground mt-1">ID: {id}</p>
            </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button id="date" variant={'outline'} className={cn('w-full md:w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? ( date.to ? ( <> {format(date.from, 'PP', { locale: ptBR })} -{' '} {format(date.to, 'PP', { locale: ptBR })} </> ) : ( format(date.from, 'PP', { locale: ptBR }) ) ) : ( <span>Selecione um período</span> )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </div>
      {error && ( <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div> )}

      {/* --- Seção de Passageiros (RESPONSIVA) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Passageiros ({isLoading ? '...' : passageiros.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : passageiros.length > 0 ? (
            <>
              {/* ✅ 2. TABELA (DESKTOP) */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Viagem (Data)</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passageiros.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.pessoa.nome}</TableCell>
                        <TableCell>{p.pessoa.cpf}</TableCell>
                        <TableCell>{formatDateTime(p.viagem?.dataHoraPartida)}</TableCell>
                        <TableCell>{formatBRL(p.valor)}</TableCell>
                        <TableCell>
                          <span className={p.pago ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                            {p.pago ? 'Pago' : 'Pendente'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* ✅ 3. CARDS (MOBILE) */}
              <div className="block md:hidden space-y-4">
                {passageiros.map((p) => (
                  <Card key={p.id} className="bg-gray-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{p.pessoa.nome}</CardTitle>
                      <CardContent className="p-0 text-sm text-muted-foreground">{p.pessoa.cpf}</CardContent>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div><b>Viagem:</b> {formatDateTime(p.viagem?.dataHoraPartida)}</div>
                      <div><b>Valor:</b> {formatBRL(p.valor)}</div>
                      <div><b>Status:</b> 
                        <span className={p.pago ? 'ml-1 text-green-600 font-medium' : 'ml-1 text-yellow-600 font-medium'}>
                          {p.pago ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Nenhum passageiro encontrado neste período.</p>
          )}
        </CardContent>
      </Card>

      {/* --- Seção de Encomendas (RESPONSIVA) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas ({isLoading ? '...' : encomendas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : encomendas.length > 0 ? (
            <>
              {/* ✅ 2. TABELA (DESKTOP) */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Viagem (Data)</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {encomendas.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.descricao}</TableCell>
                        <TableCell>{formatDateTime(e.viagem?.dataHoraPartida)}</TableCell>
                        <TableCell>{formatBRL(e.valor)}</TableCell>
                        <TableCell>
                          <span className={e.pago ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                            {e.pago ? 'Pago' : 'Pendente'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* ✅ 3. CARDS (MOBILE) */}
              <div className="block md:hidden space-y-4">
                {encomendas.map((e) => (
                  <Card key={e.id} className="bg-gray-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{e.descricao}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div><b>Viagem:</b> {formatDateTime(e.viagem?.dataHoraPartida)}</div>
                      <div><b>Valor:</b> {formatBRL(e.valor)}</div>
                      <div><b>Status:</b> 
                        <span className={e.pago ? 'ml-1 text-green-600 font-medium' : 'ml-1 text-yellow-600 font-medium'}>
                          {e.pago ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Nenhuma encomenda encontrada neste período.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxistaDetailsPage;