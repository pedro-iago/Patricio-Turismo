import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Trash2, Briefcase, DollarSign, Palette, Phone, User, ArrowUp, ArrowDown } from 'lucide-react'; // Importe ArrowUp/Down
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import api from '../services/api';

// ... (Interfaces mantidas) ...
// ... (Funções auxiliares mantidas) ...

interface PassengerTableProps {
  // ... (props anteriores) ...
  onMove?: (index: number, direction: 'up' | 'down') => void; // Nova Prop
}

export default function PassengerTable({
  passengers,
  loading,
  isPrintView = false,
  busMap,
  onMarkAsPaid,
  onOpenLuggage,
  onEdit,
  onDelete,
  onRefreshData,
  onMove, // Recebe a função
}: PassengerTableProps) {
  
  // ... (handleColorChange mantido) ...

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando passageiros...</div>;
  if (!passengers || passengers.length === 0) return <div className="text-center py-8 text-muted-foreground">Nenhum passageiro encontrado</div>;

  return (
    <>
    {/* --- VERSÃO DESKTOP --- */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 pt-print-clean hidden md:block">
      <Table>
        <TableHeader>
          {/* ... (Cabeçalhos mantidos) ... */}
        </TableHeader>
        <TableBody>
            {passengers.map((passenger, index) => {
              // ... (lógica do ônibus mantida) ...
              return (
              <TableRow key={passenger.id} className="group hover:bg-slate-50 transition-colors">
                {/* ... (Células de dados mantidas) ... */}
                
                {/* Célula de Ações */}
                {!isPrintView && (
                  <TableCell className="text-right pt-no-print">
                    <div className="flex items-center justify-end gap-1">
                      
                      {/* --- BOTÕES DE ORDENAÇÃO --- */}
                      <div className="flex flex-col mr-2 border-r pr-2 border-gray-200">
                          <Button 
                            variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                            disabled={index === 0} 
                            onClick={() => onMove?.(index, 'up')}
                            title="Mover para cima"
                          >
                              <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-gray-800 disabled:opacity-20"
                            disabled={index === passengers.length - 1}
                            onClick={() => onMove?.(index, 'down')}
                            title="Mover para baixo"
                          >
                              <ArrowDown className="w-3 h-3" />
                          </Button>
                      </div>
                      {/* --------------------------- */}

                      {!passenger.pago && (<Button variant="ghost" size="icon" onClick={() => onMarkAsPaid?.(passenger.id)} className="hover:bg-green-100 hover:text-green-800"><DollarSign className="w-4 h-4" /></Button>)}
                      <Button variant="ghost" size="icon" onClick={() => onOpenLuggage?.(passenger)} className="hover:bg-primary/10 hover:text-primary"><Briefcase className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit?.(passenger)} className="hover:bg-primary/10 hover:text-primary"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete?.(passenger)} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );})}
        </TableBody>
      </Table>
    </div>

    {/* --- VERSÃO MOBILE (CARDS) --- */}
    <div className="block md:hidden space-y-4">
        {/* Mantido igual, geralmente não colocamos ordenação complexa no card mobile para economizar espaço, ou usa-se drag-and-drop futuro */}
        {passengers.map((passenger, index) => {
            // ... (Código do card mantido igual ao anterior) ...
            // Você pode adicionar os botões de seta no CardFooter se desejar muito, mas recomendo deixar só no desktop por enquanto.
            return ( /* ... card ... */ <div key={passenger.id}>...</div> );
        })}
    </div>
    </>
  );
}