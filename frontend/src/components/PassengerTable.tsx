import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, Briefcase, DollarSign } from 'lucide-react';

// Recriando as interfaces e funções necessárias que estavam no TripDetailsPage
interface Person { id: number; nome: string; cpf: string; }
interface Address { id: number; logradouro: string; numero: string; bairro: string; cidade: string; }
interface AffiliatePerson { id: number; nome: string; }
interface Affiliate { id: number; pessoa: AffiliatePerson; }
interface Trip { id: number; }
interface PassengerData {
  id: number;
  pessoa: Person;
  viagem: Trip;
  enderecoColeta: Address;
  enderecoEntrega: Address;
  luggageCount: number; 
  taxista?: Affiliate;
  comisseiro?: Affiliate;
  valor?: number;
  metodoPagamento?: string;
  pago?: boolean;
}
const formatAddress = (addr: Address) => {
  if (!addr) return 'Endereço inválido';
  return `${addr.logradouro}, ${addr.numero} - ${addr.bairro}, ${addr.cidade}`;
};
const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Definindo as Props que o componente vai receber
interface PassengerTableProps {
  passengers: PassengerData[];
  loading: boolean;
  isPrintView?: boolean; // Para esconder ações na impressão
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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pt-print-col-passageiro">Passageiro</TableHead>
            <TableHead className="pt-print-col-endereco">Coleta / Entrega</TableHead>
            <TableHead className="pt-print-col-afiliado">Taxista / Comisseiro</TableHead>
            <TableHead className="pt-print-col-valor">Valor</TableHead>
            <TableHead className="pt-print-col-status">Status</TableHead>
            <TableHead className="pt-print-col-bagagem">Bagagem</TableHead>
            {!isPrintView && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={isPrintView ? 6 : 7} className="text-center text-muted-foreground py-8">Buscando dados...</TableCell></TableRow>
          ) : passengers.length === 0 ? (
            <TableRow><TableCell colSpan={isPrintView ? 6 : 7} className="text-center text-muted-foreground py-8">Nenhum passageiro encontrado</TableCell></TableRow>
          ) : (
            passengers.map((passenger) => (
              <TableRow key={passenger.id}>
                <TableCell>
                  <div className="font-medium">{passenger.pessoa.nome}</div>
                  <div className="text-xs text-muted-foreground">{passenger.pessoa.cpf}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs"><b>C:</b> {formatAddress(passenger.enderecoColeta)}</div>
                  <div className="text-xs"><b>E:</b> {formatAddress(passenger.enderecoEntrega)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs"><b>T:</b> {passenger.taxista?.pessoa.nome || '-'}</div>
                  <div className="text-xs"><b>C:</b> {passenger.comisseiro?.pessoa.nome || '-'}</div>
                </TableCell>
                <TableCell>{formatCurrency(passenger.valor)}</TableCell>
                <TableCell>
                  {passenger.pago ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                  )}
                </TableCell>
                <TableCell>{passenger.luggageCount} items</TableCell>
                {!isPrintView && (
                  <TableCell className="text-right">
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
  );
}