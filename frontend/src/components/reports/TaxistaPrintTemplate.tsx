import React from 'react';
import { Car, Calendar, Phone } from 'lucide-react';
import { cn } from '@/lib/utils'; // ou '../components/ui/utils' dependendo da sua estrutura

// Interfaces (Reutilizando as que você já tem)
export interface PassengerData {
    id: number;
    pessoa: { nome: string; telefone?: string };
    enderecoColeta?: { cidade: string; bairro?: string; logradouro?: string; numero?: string };
    enderecoEntrega?: { cidade: string; bairro?: string; logradouro?: string; numero?: string };
    valor?: number;
    pago?: boolean;
    bagagens?: any[];
    [key: string]: any;
}

export interface TaxistaGroup {
    id: number;
    taxista: { nome: string; telefone?: string };
    coletas: PassengerData[];
    entregas: PassengerData[];
}

interface Props {
    data: TaxistaGroup;
    tripInfo: { id: string; date: string };
}

// Usamos forwardRef para que a biblioteca consiga "pegar" este componente
export const TaxistaPrintTemplate = React.forwardRef<HTMLDivElement, Props>(({ data, tripInfo }, ref) => {
    
    const formatAddress = (addr: any) => {
        if (!addr) return "Endereço não informado";
        return `${addr.logradouro || ''}, ${addr.numero || ''} - ${addr.bairro || ''} (${addr.cidade})`;
    };

    return (
        <div ref={ref} className="p-8 bg-white text-slate-900 min-h-screen print:p-4">
            {/* CABEÇALHO */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold uppercase tracking-wide">Ordem de Serviço</h2>
                        <p className="text-sm text-slate-600 font-medium mt-1">Patricio Turismo</p>
                    </div>
                    <div className="text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{tripInfo.date}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-1">VIAGEM #{tripInfo.id}</div>
                    </div>
                </div>
                
                <div className="mt-4 bg-slate-100 p-3 rounded border border-slate-200 flex items-center gap-3 print:bg-slate-50 print:border-slate-300">
                    <div className="bg-slate-200 p-2 rounded-full print:bg-slate-200"><Car className="w-6 h-6 text-slate-700" /></div>
                    <div>
                        <span className="text-xs uppercase text-slate-500 font-bold block">Motorista Responsável</span>
                        <span className="text-lg font-bold">{data.taxista.nome}</span>
                        {data.taxista.telefone && <span className="text-sm text-slate-600 ml-3">({data.taxista.telefone})</span>}
                    </div>
                </div>
            </div>

            {/* TABELA DE COLETAS */}
            {data.coletas.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold uppercase bg-slate-800 text-white px-2 py-1 inline-block rounded mb-2 print:bg-slate-800 print:text-white">1. Coletas (Buscar)</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-300 text-left bg-slate-50 print:bg-slate-100">
                                <th className="py-2 pl-2 w-10">#</th>
                                <th className="py-2">Passageiro</th>
                                <th className="py-2">Endereço de Coleta</th>
                                <th className="py-2 text-right pr-2">Obs / Bagagem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.coletas.map((p, i) => (
                                <tr key={p.id}>
                                    <td className="py-2 pl-2 font-bold text-slate-500 align-top">{i + 1}</td>
                                    <td className="py-2 font-medium align-top">
                                        {p.pessoa.nome}
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {p.pessoa.telefone || '-'}</div>
                                    </td>
                                    <td className="py-2 text-slate-700 pr-4 align-top">{formatAddress(p.enderecoColeta)}</td>
                                    <td className="py-2 text-right pr-2 align-top">
                                        {p.bagagens && p.bagagens.length > 0 && (
                                            <div className="text-[10px] text-slate-600 mb-1">
                                                <b>{p.bagagens.length} Vols:</b> {p.bagagens.map((b:any) => b.descricao).join(', ')}
                                            </div>
                                        )}
                                        <div className="text-xs font-bold text-slate-400">{p.pago ? 'PAGO' : 'A PAGAR'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* TABELA DE ENTREGAS */}
            {data.entregas.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase bg-slate-800 text-white px-2 py-1 inline-block rounded mb-2 print:bg-slate-800 print:text-white">2. Entregas (Levar)</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-300 text-left bg-slate-50 print:bg-slate-100">
                                <th className="py-2 pl-2 w-10">#</th>
                                <th className="py-2">Passageiro</th>
                                <th className="py-2">Endereço de Entrega</th>
                                <th className="py-2 text-right pr-2">Obs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.entregas.map((p, i) => (
                                <tr key={p.id}>
                                    <td className="py-2 pl-2 font-bold text-slate-500 align-top">{i + 1}</td>
                                    <td className="py-2 font-medium align-top">
                                        {p.pessoa.nome}
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {p.pessoa.telefone || '-'}</div>
                                    </td>
                                    <td className="py-2 text-slate-700 pr-4 align-top">{formatAddress(p.enderecoEntrega)}</td>
                                    <td className="py-2 text-right pr-2 text-xs align-top">
                                        {p.bagagens && p.bagagens.length > 0 ? `${p.bagagens.length} Vols` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-auto border-t border-slate-200 pt-4 flex justify-between text-[10px] text-slate-400 uppercase">
                <span>Patricio Turismo - Sistema de Gestão</span>
                <span>Impresso em {new Date().toLocaleString()}</span>
            </div>
        </div>
    );
});