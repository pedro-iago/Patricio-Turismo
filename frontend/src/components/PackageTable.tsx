import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

// --- Interfaces ---
interface Person { id: number; nome: string; telefone?: string | null; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }

// --- MUDANÇA: Interface de dados atualizada ---
interface PackageData {
  id: number;
  descricao: string;
  remetente: Person;
  destinatario: Person;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  // taxista?: Affiliate; // <-- REMOVIDO
  taxistaColeta?: Affiliate; // <-- ADICIONADO
  taxistaEntrega?: Affiliate; // <-- ADICIONADO
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}
// --- FIM DA MUDANÇA ---

const formatAddress = (addr: Address) => {
  if (!addr) return 'Endereço inválido';
  return `${addr.logradouro}, ${addr.numero} - ${addr.bairro}, ${addr.cidade}`;
};
const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface PackageTableProps {
  packages: PackageData[];
  loading: boolean;
  isPrintView?: boolean;
  onMarkAsPaid?: (id: number) => void;
  onEdit?: (pkg: PackageData) => void;
  onDelete?: (pkg: PackageData) => void;
}

export default function PackageTable({
  packages,
  loading,
  isPrintView = false,
  onMarkAsPaid,
  onEdit,
  onDelete,
}: PackageTableProps) {
  
  return (
    <>
      {/* --- TABELA (DESKTOP) --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pt-print-col-descricao">Descrição</TableHead>
              <TableHead className="pt-print-col-remetente">Remetente / Destinatário</TableHead>
              <TableHead className="pt-print-col-afiliado">Taxista / Comisseiro</TableHead>
              <TableHead className="pt-print-col-valor">Valor</TableHead>
              <TableHead className="pt-print-col-status">Status</TableHead>
              {!isPrintView && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={isPrintView ? 5 : 6} className="text-center text-muted-foreground py-8">Buscando dados...</TableCell></TableRow>
            ) : packages.length === 0 ? (
              <TableRow><TableCell colSpan={isPrintView ? 5 : 6} className="text-center text-muted-foreground py-8">Nenhuma encomenda encontrada</TableCell></TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.descricao}</TableCell>
                  <TableCell>
                    <div className="text-xs"><b>De:</b> {pkg.remetente.nome} ({pkg.remetente.telefone || 'N/A'})</div>
                    <div className="text-xs"><b>Para:</b> {pkg.destinatario.nome} ({pkg.destinatario.telefone || 'N/A'})</div>
                  </TableCell>
                  
                  {/* --- MUDANÇA: Célula de Afiliados --- */}
                  <TableCell>
                    <div className="text-xs"><b>T(Coleta):</b> {pkg.taxistaColeta?.pessoa.nome || '-'}</div>
                    <div className="text-xs"><b>T(Entrega):</b> {pkg.taxistaEntrega?.pessoa.nome || '-'}</div>
                    <div className="text-xs"><b>C:</b> {pkg.comisseiro?.pessoa.nome || '-'}</div>
                  </TableCell>
                  {/* --- FIM DA MUDANÇA --- */}

                  <TableCell>{formatCurrency(pkg.valor)}</TableCell>
                  <TableCell>
                    {pkg.pago ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                    )}
                  </TableCell>
                  {!isPrintView && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!pkg.pago && (
                          <Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(pkg.id)} className="hover:bg-green-100 hover:text-green-800">
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(pkg)} className="hover:bg-primary/10 hover:text-primary">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete?.(pkg)} className="hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- CARDS (MOBILE) --- */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground p-4">Buscando dados...</div>
        ) : packages.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">Nenhuma encomenda encontrada</div>
        ) : (
          packages.map((pkg) => (
            <Card key={pkg.id} className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>{pkg.descricao}</CardTitle>
                <CardDescription>
                  {pkg.pago ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                  )}
                  <span className="ml-2 font-medium">{formatCurrency(pkg.valor)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">De:</p>
                  <p>{pkg.remetente.nome} ({pkg.remetente.telefone || 'N/A'})</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Para:</p>
                  <p>{pkg.destinatario.nome} ({pkg.destinatario.telefone || 'N/A'})</p>
                </div>

                {/* --- MUDANÇA: Card de Afiliados --- */}
                <div className="text-xs border-t pt-2">
                  <p><b>T(Coleta):</b> {pkg.taxistaColeta?.pessoa.nome || '-'}</p>
                  <p><b>T(Entrega):</b> {pkg.taxistaEntrega?.pessoa.nome || '-'}</p>
                  <p><b>Comisseiro:</b> {pkg.comisseiro?.pessoa.nome || '-'}</p>
                </div>
                {/* --- FIM DA MUDANÇA --- */}

              </CardContent>
              {!isPrintView && (
                <CardFooter className="flex justify-end gap-1">
                  {!pkg.pago && (
                    <Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(pkg.id)} className="hover:bg-green-100 hover:text-green-800" title="Marcar como Pago">
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onEdit?.(pkg)} className="hover:bg-primary/10 hover:text-primary" title="Editar Encomenda">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete?.(pkg)} className="hover:bg-destructive/10 hover:text-destructive" title="Excluir Encomenda">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}