import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

// Importe suas funções de API
import {
  getPessoaPassageiroReport,
  getPessoaEncomendasEnviadas,
  getPessoaEncomendasRecebidas,
} from '../services/api';

// Importe seus componentes SHADCN/UI
import { Button } from './ui/button';
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
  viagem?: {
    dataHoraPartida: string;
  };
  valor?: number;
  pago?: boolean;
}

const PessoaDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Estado para Dados (3 listas)
  const [passageiroHist, setPassageiroHist] = useState<PassageiroReport[]>([]);
  const [encomendasEnv, setEncomendasEnv] = useState<EncomendaReport[]>([]);
  const [encomendasRec, setEncomendasRec] = useState<EncomendaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Chamar a API (sem filtro de data)
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Busca os 3 relatórios em paralelo
        const [passageiroData, encomendasEnviadasData, encomendasRecebidasData] = await Promise.all([
          getPessoaPassageiroReport(id),
          getPessoaEncomendasEnviadas(id),
          getPessoaEncomendasRecebidas(id),
        ]);
        setPassageiroHist(passageiroData);
        setEncomendasEnv(encomendasEnviadasData);
        setEncomendasRec(encomendasRecebidasData);
      } catch (err) {
        console.error('Erro ao buscar histórico:', err);
        setError('Não foi possível carregar o histórico.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
           <Button variant="ghost" size="icon" onClick={() => navigate('/people')}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              {/* TODO: Idealmente, buscaria o nome da pessoa pelo ID */}
              <h2 className="text-2xl font-semibold">Histórico da Pessoa</h2>
              <p className="text-muted-foreground mt-1">ID: {id}</p>
            </div>
        </div>
      </div>
      
      {error && (
        <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div>
      )}

      {/* 1. Tabela: Viagens como Passageiro */}
      <Card>
        <CardHeader>
          <CardTitle>Viagens como Passageiro ({isLoading ? '...' : passageiroHist.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : passageiroHist.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Viagem (Data)</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passageiroHist.map((p) => (
                  <TableRow key={p.id}>
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
            <p className="text-muted-foreground">Nenhum registro como passageiro.</p>
          )}
        </CardContent>
      </Card>

      {/* 2. Tabela: Encomendas Enviadas */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas Enviadas ({isLoading ? '...' : encomendasEnv.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : encomendasEnv.length > 0 ? (
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
                {encomendasEnv.map((e) => (
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
          ) : (
            <p className="text-muted-foreground">Nenhuma encomenda enviada.</p>
          )}
        </CardContent>
      </Card>
      
      {/* 3. Tabela: Encomendas Recebidas */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas Recebidas ({isLoading ? '...' : encomendasRec.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : encomendasRec.length > 0 ? (
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
                {encomendasRec.map((e) => (
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
          ) : (
            <p className="text-muted-foreground">Nenhuma encomenda recebida.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PessoaDetailsPage;