import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import {
  getPessoaPassageiroReport,
  getPessoaEncomendasEnviadas,
  getPessoaEncomendasRecebidas,
} from '../services/api';
import { Button } from './ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
// ✅ 1. IMPORTE OS COMPONENTES DE CARD (JÁ EXISTIAM)
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

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


const PessoaDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [passageiroHist, setPassageiroHist] = useState<PassageiroReport[]>([]);
  const [encomendasEnv, setEncomendasEnv] = useState<EncomendaReport[]>([]);
  const [encomendasRec, setEncomendasRec] = useState<EncomendaReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... (useEffect de fetch - SEM ALTERAÇÃO) ...
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
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


  return (
    <div className="space-y-6">
      {/* ... (Cabeçalho - SEM ALTERAÇÃO) ... */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/people')}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-semibold">Histórico da Pessoa</h2>
              <p className="text-muted-foreground mt-1">ID: {id}</p>
            </div>
        </div>
      </div>
      {error && ( <div className="text-red-600 bg-red-100 p-4 rounded-md">{error}</div> )}

      {/* --- Tabela: Viagens como Passageiro (RESPONSIVA) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Viagens como Passageiro ({isLoading ? '...' : passageiroHist.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : passageiroHist.length > 0 ? (
            <>
              {/* ✅ 2. TABELA (DESKTOP) */}
              <div className="hidden md:block">
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
              </div>
              {/* ✅ 3. CARDS (MOBILE) */}
              <div className="block md:hidden space-y-4">
                {passageiroHist.map((p) => (
                  <Card key={p.id} className="bg-gray-50">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base">Viagem em {formatDateTime(p.viagem?.dataHoraPartida)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
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
            <p className="text-muted-foreground">Nenhum registro como passageiro.</p>
          )}
        </CardContent>
      </Card>

      {/* --- Tabela: Encomendas Enviadas (RESPONSIVA) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas Enviadas ({isLoading ? '...' : encomendasEnv.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : encomendasEnv.length > 0 ? (
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
              </div>
              {/* ✅ 3. CARDS (MOBILE) */}
              <div className="block md:hidden space-y-4">
                {encomendasEnv.map((e) => (
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
            <p className="text-muted-foreground">Nenhuma encomenda enviada.</p>
          )}
        </CardContent>
      </Card>
      
      {/* --- Tabela: Encomendas Recebidas (RESPONSIVA) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas Recebidas ({isLoading ? '...' : encomendasRec.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : encomendasRec.length > 0 ? (
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
              </div>
              {/* ✅ 3. CARDS (MOBILE) */}
              <div className="block md:hidden space-y-4">
                {encomendasRec.map((e) => (
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
            <p className="text-muted-foreground">Nenhuma encomenda recebida.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PessoaDetailsPage;