import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableCell } from './ui/table'; 
import { GripVertical } from 'lucide-react';
import { cn } from './ui/utils';

interface SortablePassengerRowProps {
  id: number;
  children: React.ReactNode;
  isPrintView?: boolean;
  className?: string; // <--- ISSO É O QUE FAZ A COR FUNCIONAR
}

export function SortablePassengerRow({ id, children, isPrintView, className }: SortablePassengerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : undefined,
    // Se estiver arrastando, fica branco destacado, senão obedece o CSS
    backgroundColor: isDragging ? '#ffffff' : undefined, 
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none',
  };

  return (
    <tr 
        ref={setNodeRef} 
        style={style} 
        className={cn(
            "border-b transition-colors group", // Base
            // Se NÃO tiver classe extra (não agrupado), usa o hover padrão
            !className && "hover:bg-slate-50/50",
            // AQUI APLICAMOS A COR DO GRUPO
            className 
        )}
    >
      {!isPrintView && (
        <TableCell 
            className="w-8 p-0 text-center cursor-grab touch-none pt-no-print align-middle"
            {...attributes} 
            {...listeners}
        >
            <div className="flex items-center justify-center h-full w-full py-4">
                <GripVertical className="w-4 h-4 text-gray-300 hover:text-gray-600" />
            </div>
        </TableCell>
      )}
      {children}
    </tr>
  );
}