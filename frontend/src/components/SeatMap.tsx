import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from './ui/utils';
import api from '@/services/api';

// --- Interfaces do Backend ---
interface PessoaDto { nome: string; cpf: string; }
interface AssentoDto {
    id: number;
    numero: string;
    ocupado: boolean; 
    passageiro: PessoaDto | null; 
}

interface SeatMapProps {
    tripId: number;
    onSelectSeat: (seatId: number, seatNumber: string, isOccupied: boolean) => void;
    onRefresh: () => void;
    refreshKey: number; 
}

export default function SeatMap({ tripId, onSelectSeat, onRefresh, refreshKey }: SeatMapProps) {
    const [seats, setSeats] = useState<AssentoDto[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSeats = async () => {
        
        // Trava de segurança para evitar chamada com ID inválido
        if (!tripId || isNaN(tripId)) {
            setLoading(false); 
            return; 
        }
        
        setLoading(true);
        try {
            const response = await api.get<AssentoDto[]>(`/api/viagem/${tripId}/assentos`);
            
            // ✅ --- CORREÇÃO ESTÁ AQUI --- ✅
            // Força a ordenação numérica, já que a API retorna em ordem alfabética (1, 10, 2)
            const sortedSeats = response.data.sort((a, b) => {
                return parseInt(a.numero) - parseInt(b.numero);
            });

            setSeats(sortedSeats); // Salva os dados JÁ ORDENADOS

        } catch (error) {
            console.error("Erro ao buscar mapa de assentos:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSeats();
    }, [tripId, refreshKey]); // Roda quando o ID ou a chave de atualização mudam
    
    // --- LÓGICA DE LAYOUT (Agrupamento em filas) ---
    const seatsPerRow = 4;
    const totalSeats = seats.length;
    const validSeats = seats.filter(s => s.numero); 

    const orderedRows = [];
    for (let i = 0; i < validSeats.length; i += seatsPerRow) {
        orderedRows.push(validSeats.slice(i, i + seatsPerRow));
    }
    
    // --- Renderização de Assento Individual ---
    const renderSeat = (seat: AssentoDto) => {
        const statusClass = seat.ocupado
            ? "bg-red-500 hover:bg-red-600 cursor-pointer"
            : "bg-green-500 hover:bg-green-600 cursor-pointer";
        
        const content = (
            <div
                className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-md text-white font-semibold transition-colors shadow-md",
                    statusClass
                )}
            >
                {seat.numero}
            </div>
        );

        if (seat.ocupado && seat.passageiro) {
            // Se OCUPADO, usa Popover (clicável)
            return (
                <Popover key={seat.id}>
                    <PopoverTrigger asChild>
                        <div className="cursor-pointer">{content}</div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 space-y-2 text-sm">
                        <p className="font-bold">{seat.passageiro.nome}</p>
                        <p className="text-muted-foreground">CPF: {seat.passageiro.cpf}</p>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                                onSelectSeat(seat.id, seat.numero, true); // Aciona desvinculação
                            }}
                        >
                            <X className="w-4 h-4 mr-1" /> Desvincular Assento
                        </Button>
                    </PopoverContent>
                </Popover>
            );
        }

        // Se LIVRE, o onClick é direto no assento
        return (
            <div 
                key={seat.id} 
                onClick={() => onSelectSeat(seat.id, seat.numero, seat.ocupado)}
            >
                {content}
            </div>
        );
    };
    
    // Placeholder de loading
    if (loading) { 
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Mapa de Assentos</CardTitle>
                </CardHeader>
                <CardContent className="h-40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }
    
    // Placeholder se não houver assentos
    if (totalSeats === 0 && !loading) { 
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Mapa de Assentos</CardTitle>
                </CardHeader>
                <CardContent className="h-40 flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum assento encontrado.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mapa de Assentos</CardTitle>
                <CardDescription>
                    Total: {totalSeats} assentos | Livres: {seats.filter(s => !s.ocupado).length}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-6 space-y-4">
                
                <div className="w-full max-w-lg bg-gray-200 p-2 rounded-t-lg text-center text-xs font-semibold">
                    Frente (Motorista à Esquerda)
                </div>
                
                <div className="flex flex-col gap-3 p-2 bg-gray-50 rounded-lg">
                    {orderedRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-4">
                            {row.map((seat, index) => {
                                if (index === 2) { // Adiciona o corredor
                                    return (
                                        <React.Fragment key={seat.id}>
                                            <div className="w-6 shrink-0" /> 
                                            {renderSeat(seat)}
                                        </React.Fragment>
                                    );
                                }
                                return renderSeat(seat);
                            })}
                        </div>
                    ))}
                </div>

                <div className="w-full max-w-lg bg-gray-200 p-2 rounded-b-lg text-center text-xs font-semibold mt-4">
                    Traseira
                </div>
                
            </CardContent>
        </Card>
    );
}