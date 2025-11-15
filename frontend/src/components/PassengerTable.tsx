import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, Briefcase, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

// --- Interfaces ---
interface Person { id: number; nome: string; cpf: string; telefone?: string | null; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Trip { id: number; }

// --- MUDANÇA: Interface de dados atualizada ---
interface PassengerData {
  id: number;
  pessoa: Person;
  viagem: Trip;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  luggageCount: number;
  // taxista?: Affiliate; // <-- REMOVIDO
  taxistaColeta?: Affiliate; // <-- ADICIONADO
  taxistaEntrega?: Affiliate; // <-- ADICIONADO
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
  numeroAssento?: string;
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

interface PassengerTableProps {
  passengers: PassengerData[];
  loading: boolean;
  isPrintView?: boolean;
  onMarkAsPaid?: (id: number) => void;
  onOpenLuggage?: (passenger: PassengerData) => void;
  onEdit?: (passenger: PassengerData) => void;
  onDelete?: (passenger: PassengerData) => void;
}

export default function PassengerTable({
  passengers,
  loading,
  isPrintView = false,
  onMarkAsPaid,
  onOpenLuggage,
  onEdit,
  onDelete,
}: PassengerTableProps) {
  
  const colSpan = isPrintView ? 7 : 8;

  return (
    <>
      {/* --- TABELA (DESKTOP) --- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-print-clean hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pt-print-col-passageiro">Passageiro</TableHead>
              <TableHead className="pt-print-col-endereco">Coleta / Entrega</TableHead>
              <TableHead className="pt-print-col-afiliado">Taxista / Comisseiro</TableHead>
              <TableHead className="pt-print-col-valor">Valor</TableHead>
              <TableHead className="pt-print-col-status">Status</TableHead>
              <TableHead className="pt-print-col-assento">Assento</TableHead>
              <TableHead className="pt-print-col-bagagem">Bagagem</TableHead>
              {!isPrintView && <TableHead className="text-right pt-no-print">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">Buscando dados...</TableCell></TableRow>
            ) : !passengers || passengers.length === 0 ? (
              <TableRow><TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">Nenhum passageiro encontrado</TableCell></TableRow>
            ) : (
              passengers.map((passenger) => (
                <TableRow key={passenger.id}>
                  <TableCell className="pt-print-col-passageiro">
                    <div className="font-medium">{passenger.pessoa.nome}</div>
                    <div className="text-xs text-muted-foreground">{passenger.pessoa.cpf}</div>
                    <div className="text-xs text-muted-foreground">{passenger.pessoa.telefone || ''}</div>
                  </TableCell>
                  <TableCell className="pt-print-col-endereco">
                    <div className="text-xs"><b>C:</b> {formatAddress(passenger.enderecoColeta)}</div>
                    <div className="text-xs"><b>E:</b> {formatAddress(passenger.enderecoEntrega)}</div>
                  </TableCell>
                  
                  {/* --- MUDANÇA: Célula de Afiliados --- */}
                  <TableCell className="pt-print-col-afiliado">
                    <div className="text-xs"><b>T(Coleta):</b> {passenger.taxistaColeta?.pessoa.nome || '-'}</div>
                    <div className="text-xs"><b>T(Entrega):</b> {passenger.taxistaEntrega?.pessoa.nome || '-'}</div>
                    <div className="text-xs"><b>C:</b> {passenger.comisseiro?.pessoa.nome || '-'}</div>
                  </TableCell>
                  {/* --- FIM DA MUDANÇA --- */}

                  <TableCell className="pt-print-col-valor">{formatCurrency(passenger.valor)}</TableCell>
                  <TableCell className="pt-print-col-status">
                    {passenger.pago ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                    )}
                  </TableCell>
                  <TableCell className="pt-print-col-assento">{passenger.numeroAssento || '-'}</TableCell>
                  <TableCell className="pt-print-col-bagagem">{passenger.luggageCount} items</TableCell>
                  {!isPrintView && (
                    <TableCell className="text-right pt-no-print">
                      <div className="flex items-center justify-end gap-1">
                        {!passenger.pago && (
                          <Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(passenger.id)} className="hover:bg-green-100 hover:text-green-800">
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onOpenLuggage?.(passenger)} className="hover:bg-primary/10 hover:text-primary">
                          <Briefcase className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(passenger)} className="hover:bg-primary/10 hover:text-primary">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete?.(passenger)} className="hover:bg-destructive/10 hover:text-destructive">
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
        ) : !passengers || passengers.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">Nenhum passageiro encontrado</div>
        ) : (
          passengers.map((passenger) => (
            <Card key={passenger.id} className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>{passenger.pessoa.nome}</CardTitle>
                <CardDescription>
                  {passenger.pago ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                  )}
                  <span className="ml-2 font-medium">{formatCurrency(passenger.valor)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">CPF:</p>
                  <p>{passenger.pessoa.cpf}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Telefone:</p>
                  <p>{passenger.pessoa.telefone || '-'}</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details" className="border-b-0">
                    <AccordionTrigger className="text-sm py-2 hover:no-underline">
                      Mais Detalhes
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                      <div>
                        <p className="font-medium text-muted-foreground">Assento:</p>
                        <p>{passenger.numeroAssento || '-'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Bagagem:</p>
                        <p>{passenger.luggageCount} items</p>
                      </div>
                      <div className="border-t pt-2">
                        <p className="font-medium text-muted-foreground">End. Coleta:</p>
                        <p className="text-xs">{formatAddress(passenger.enderecoColeta)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">End. Entrega:</p>
                        <p className="text-xs">{formatAddress(passenger.enderecoEntrega)}</p>
                      </div>
                      
                      {/* --- MUDANÇA: Card de Afiliados --- */}
                      <div className="text-xs border-t pt-2">
                        <p><b>T(Coleta):</b> {passenger.taxistaColeta?.pessoa.nome || '-'}</p>
                        <p><b>T(Entrega):</b> {passenger.taxistaEntrega?.pessoa.nome || '-'}</p>
                        <p><b>Comisseiro:</b> {passenger.comisseiro?.pessoa.nome || '-'}</p>
                      </div>
                      {/* --- FIM DA MUDANÇA --- */}

                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
              </CardContent>
              {!isPrintView && (
                <CardFooter className="flex justify-end gap-1">
                  {!passenger.pago && (
                    <Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(passenger.id)} className="hover:bg-green-100 hover:text-green-800" title="Marcar como Pago">
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onOpenLuggage?.(passenger)} className="hover:bg-primary/10 hover:text-primary" title="Ver Bagagem">
                    <Briefcase className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit?.(passenger)} className="hover:bg-primary/10 hover:text-primary" title="Editar Passageiro">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete?.(passenger)} className="hover:bg-destructive/10 hover:text-destructive" title="Excluir Passageiro">
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