import React, { createContext, useContext } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from './ui/utils';

// Contexto para passar os controles de arrasto para o ícone
const SortableGroupContext = createContext<{
  attributes: any;
  listeners: any;
  isDragging: boolean;
} | null>(null);

export function useSortableGroup() {
  return useContext(SortableGroupContext);
}

interface SortablePassengerGroupProps {
  id: string | number;
  children: React.ReactNode;
  isGrouped: boolean;
}

export function SortablePassengerGroup({ id, children, isGrouped }: SortablePassengerGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform), // Use Translate em vez de Transform para tabelas (melhor performance visual)
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <SortableGroupContext.Provider value={{ attributes, listeners, isDragging }}>
      <tbody
        ref={setNodeRef}
        style={style}
        className={cn(
          "transition-colors", // Removemos 'block' e 'relative' daqui para evitar bugs de layout
          
          // Estilo quando está sendo arrastado (Sutil, pois sombras em tbody são difíceis em HTML puro)
          isDragging && "opacity-80 bg-orange-50/50",
          
          // Borda do grupo quando parado
          isGrouped && !isDragging && "group-wrapper"
        )}
      >
        {children}
      </tbody>
    </SortableGroupContext.Provider>
  );
}