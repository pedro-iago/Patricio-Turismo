import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from './ui/utils';

// --- INTERFACES ---
interface PassengerData {
    id: number;
    pessoa: { nome: string; cpf: string };
    numeroAssento?: string;
    [key: string]: any;
}

interface SeatLayout {
    numero: string | null;
    tipo: 'JANELA' | 'CORREDOR' | 'VAZIO' | 'MOTORISTA' | 'ESCADA';
}

interface SeatMapProps {
    tripId: number;
    busId: number;
    layoutJson?: string;
    capacity: number;
    passengers?: PassengerData[];
    onSelectSeat: (seatId: number, seatNumber: string, isOccupied: boolean) => void;
}

export default function SeatMap({ 
    layoutJson, 
    capacity, 
    passengers = [], 
    onSelectSeat 
}: SeatMapProps) {

    // 1. Processa o Layout
    const matrix: SeatLayout[][] = useMemo(() => {
        let parsedMatrix: SeatLayout[][] | null = null;
        if (layoutJson && layoutJson.length > 10) {
            try {
                const parsed = JSON.parse(layoutJson);
                if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) parsedMatrix = parsed;
            } catch (e) { console.warn("Erro JSON bus:", e); }
        }
        if (parsedMatrix) return parsedMatrix;

        // Fallback
        const safeCapacity = (capacity && capacity > 0) ? capacity : 46;
        const rows = Math.ceil(safeCapacity / 4);
        const grid: SeatLayout[][] = [];
        let seatCount = 1;
        for (let i = 0; i < rows; i++) {
            const row: SeatLayout[] = [];
            for (let j = 0; j < 4; j++) {
                 row.push({ numero: seatCount <= safeCapacity ? String(seatCount++).padStart(2, '0') : '', tipo: 'JANELA' });
            }
            grid.push(row);
        }
        return grid;
    }, [layoutJson, capacity]);

    // 2. Encontrar passageiro (IGNORA ZERO À ESQUERDA)
    const getPassengerInSeat = (seatNumber: string) => {
        if (!seatNumber) return undefined;
        return passengers.find(p => {
            if (!p.numeroAssento) return false;
            // Compara numericamente (2 == "02")
            return parseInt(p.numeroAssento, 10) === parseInt(seatNumber, 10);
        }); 
    };

    // 3. Renderizar Assento
    const renderSeat = (seat: SeatLayout) => {
        if (!seat.numero || seat.tipo === 'VAZIO' || seat.tipo === 'CORREDOR') return <div className="w-10 h-10" />; 

        const passenger = getPassengerInSeat(seat.numero);
        const isOccupied = !!passenger;

        // Cores
        let bgColor = "bg-green-500 hover:bg-green-600 border-green-600";
        if (isOccupied) bgColor = "bg-red-500 hover:bg-red-600 border-red-600";

        const SeatButton = (
            <button
                className={cn("w-10 h-10 flex items-center justify-center rounded-md text-white font-bold shadow-sm transition-all border-b-4 border-black/10", bgColor)}
                onClick={() => !isOccupied && onSelectSeat(0, seat.numero!, false)}
            >
                {seat.numero}
            </button>
        );

        if (isOccupied && passenger) {
            return (
                <Popover key={seat.numero}>
                    <PopoverTrigger asChild><div>{SeatButton}</div></PopoverTrigger>
                    <PopoverContent className="w-64 p-4 space-y-3 z-50 shadow-xl">
                        <div>
                            <h4 className="font-bold text-lg leading-none">{passenger.pessoa.nome}</h4>
                            <p className="text-sm text-muted-foreground mt-1">CPF: {passenger.pessoa.cpf}</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            // AQUI: Passa o ID do passageiro explicitamente
                            onClick={() => onSelectSeat(passenger.id, seat.numero!, true)}
                        >
                            <X className="w-4 h-4 mr-2" /> Liberar Assento
                        </Button>
                    </PopoverContent>
                </Popover>
            );
        }
        return SeatButton;
    };

    return (
        <Card className="w-full max-w-fit mx-auto bg-white shadow-sm border border-slate-200">
            <CardHeader className="pb-2 border-b bg-slate-50/50">
                <CardTitle className="flex justify-between items-center text-base">
                    <span>Mapa de Assentos</span>
                    <span className="text-xs font-normal bg-white border px-3 py-1 rounded-full text-slate-600">{passengers.length} Ocupados</span>
                </CardTitle>
                <CardDescription>Vista superior do veículo</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center bg-slate-50 min-h-[400px]">
                <div className="w-full flex justify-between mb-6 px-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b pb-2">
                    <div className="flex flex-col items-center gap-1"><div className="w-8 h-8 border-2 border-slate-300 rounded-full flex items-center justify-center">M</div><span>Motorista</span></div>
                    <div className="flex flex-col items-center gap-1"><div className="w-8 h-2 bg-slate-200 rounded-full mb-2"></div><span>Porta</span></div>
                </div>

                <div className="flex flex-col gap-3">
                    {matrix.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-3 justify-center items-center">
                            {row.map((seat, colIndex) => (
                                <React.Fragment key={`${rowIndex}-${colIndex}`}>
                                    {renderSeat(seat)}
                                    {colIndex === 1 && row.length === 4 && <div className="w-8 sm:w-12"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex gap-6 text-xs font-medium text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Livre</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Ocupado</div>
                </div>
            </CardContent>
        </Card>
    );
}