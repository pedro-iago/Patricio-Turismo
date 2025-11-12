import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { DateRange } from 'react-day-picker';

// Importe suas funções de API
import {
  getTaxistaPassageirosReport,
  getTaxistaEncomendasReport,
} from '../services/api';

// Importe seus componentes SHADCN/UI
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { cn } from './ui/utils';

// Tipos
interface PassageiroReport {
  id: string;
  pessoa: {
    nome: string;
    cpf: string;
  };
  viagem?: {
    dataHoraPartida: string;
  };
  valor?: number;
  pago?: boolean;
}

interface EncomendaReport {
  id: string;
  descricao: string;
  // status: string; // <-- REMOVIDO
  viagem?: {
    dataHoraPartida: string;
  };
  valor?: number;
  pago?: boolean;
}

const TaxistaDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Estado para Filtro de Data
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30); // Padrão: últimos 30 dias
    return { from: inicio, to: fim };
  });

  // 2. Estado para Dados
  const [passageiros, setPassageiros] = useState<PassageiroReport[]>([]);
  const [encomendas, setEncomendas] = useState<EncomendaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Chamar a API
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

  // Helper para formatar data/hora
  const formatDateTime = (dateTimeString: string | undefined) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('pt-BR');
  };

  // Helper para formatar moeda
  const formatBRL = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
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
        
        {/* 4. Componente de Filtro de Data (DateRangePicker) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-full md:w-[300px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'PP', { locale: ptBR })} -{' '}
                    {format(date.to, 'PP', { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, 'PP', { locale: ptBR })
                )
              ) : (
                <span>Selecione um período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {error && (
        <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>
      )}

      {/* 5. Seção de Passageiros */}
      <Card>
        <CardHeader>
          <CardTitle>Passageiros ({isLoading ? '...' : passageiros.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : passageiros.length > 0 ? (
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
          ) : (
            <p className="text-muted-foreground">Nenhum passageiro encontrado neste período.</p>
          )}
        </CardContent>
      </Card>

      {/* 6. Seção de Encomendas */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas ({isLoading ? '...' : encomendas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : encomendas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  {/* <TableHead>Status</TableHead> <-- REMOVIDO */}
                  <TableHead>Viagem (Data)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encomendas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.descricao}</TableCell>
                    {/* <TableCell>{e.status}</TableCell> <-- REMOVIDO */}
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
          ) : (
            <p className="text-muted-foreground">Nenhuma encomenda encontrada neste período.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxistaDetailsPage;