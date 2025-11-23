import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from './ui/button';
import { ArrowLeft, Car, Calendar, Phone, Download, Printer } from 'lucide-react';
import { cn } from './ui/utils'; 

type ReportType = 'COLETA' | 'ENTREGA';

// === SUB-COMPONENTE: O DESIGN DA FOLHA A4 ===
const PrintSheet = ({ data, tripInfo, type }: { data: any, tripInfo: any, type: ReportType }) => {
    
    const formatAddress = (addr: any) => {
        if (!addr) return "Endereço não informado";
        return `${addr.logradouro || ''}, ${addr.numero || ''} - ${addr.bairro || ''} (${addr.cidade})`;
    };

    const showColeta = type === 'COLETA' && data.coletas.length > 0;
    const showEntrega = type === 'ENTREGA' && data.entregas.length > 0;
    const isEmpty = !showColeta && !showEntrega;

    return (
        <div className="bg-white text-slate-900 w-full h-auto p-0 text-sm font-sans">
            {/* CABEÇALHO */}
            <div className="border-b-2 border-orange-600 pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                            {type === 'COLETA' ? 'Roteiro de Coleta' : 'Roteiro de Entrega'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Patricio Turismo - Ordem de Serviço</p>
                    </div>
                    <div className="text-right text-sm">
                        <div className="flex items-center justify-end gap-2 text-slate-700">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="font-bold">{tripInfo.date}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-1">VIAGEM #{tripInfo.id}</div>
                    </div>
                </div>
                
                <div className="mt-4 bg-orange-50 p-3 rounded border border-orange-100 flex items-center gap-3 print:bg-white print:border-slate-300">
                    <div className="bg-orange-100 p-2 rounded-full print:bg-slate-100">
                        <Car className="w-6 h-6 text-orange-600 print:text-slate-700" />
                    </div>
                    <div>
                        <span className="text-xs uppercase text-slate-500 font-bold block">Motorista Responsável</span>
                        <span className="text-lg font-bold text-slate-900">{data.taxista.nome}</span>
                        {data.taxista.telefone && <span className="text-sm text-slate-600 ml-3">({data.taxista.telefone})</span>}
                    </div>
                </div>
            </div>

            {isEmpty && (
                <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded bg-slate-50">
                    Este motorista não possui {type === 'COLETA' ? 'coletas' : 'entregas'} nesta viagem.
                </div>
            )}

            {/* TABELA DE COLETAS */}
            {showColeta && (
                <div className="mb-6">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            {/* Cabeçalho da Tabela em Laranja na Impressão */}
                            <tr className="border-b border-orange-600 text-left bg-orange-600 text-white print:bg-orange-600 print:text-white">
                                <th className="py-2 pl-2 w-8 border-r border-orange-500/30">#</th>
                                <th className="py-2 pl-2 w-1/4 border-r border-orange-500/30">Passageiro</th>
                                <th className="py-2 pl-2 border-r border-orange-500/30">Endereço de Coleta</th>
                                <th className="py-2 pl-2 text-right w-1/4 pr-2">Obs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 border border-slate-200">
                            {data.coletas.map((p: any, i: number) => (
                                <tr key={p.id}>
                                    <td className="py-2 pl-2 font-bold text-slate-500 align-top border-r border-slate-200">{i + 1}</td>
                                    <td className="py-2 pl-2 font-medium align-top border-r border-slate-200">
                                        {p.pessoa.nome}
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {p.pessoa.telefone || '-'}</div>
                                    </td>
                                    <td className="py-2 pl-2 text-slate-700 pr-2 align-top border-r border-slate-200">{formatAddress(p.enderecoColeta)}</td>
                                    <td className="py-2 pl-2 text-right align-top pr-2 bg-slate-50/50">
                                        {p.bagagens && p.bagagens.length > 0 && (
                                            <div className="text-[10px] mb-1 text-slate-700">
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
            {showEntrega && (
                <div>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-orange-600 text-left bg-orange-600 text-white print:bg-orange-600 print:text-white">
                                <th className="py-2 pl-2 w-8 border-r border-orange-500/30">#</th>
                                <th className="py-2 pl-2 w-1/4 border-r border-orange-500/30">Passageiro</th>
                                <th className="py-2 pl-2 border-r border-orange-500/30">Endereço de Entrega</th>
                                <th className="py-2 pl-2 text-right w-1/4 pr-2">Obs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 border border-slate-200">
                            {data.entregas.map((p: any, i: number) => (
                                <tr key={p.id}>
                                    <td className="py-2 pl-2 font-bold text-slate-500 align-top border-r border-slate-200">{i + 1}</td>
                                    <td className="py-2 pl-2 font-medium align-top border-r border-slate-200">
                                        {p.pessoa.nome}
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {p.pessoa.telefone || '-'}</div>
                                    </td>
                                    <td className="py-2 pl-2 text-slate-700 pr-2 align-top border-r border-slate-200">{formatAddress(p.enderecoEntrega)}</td>
                                    <td className="py-2 pl-2 text-right align-top text-xs pr-2 bg-slate-50/50">
                                        {p.bagagens && p.bagagens.length > 0 ? `${p.bagagens.length} Vols` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div className="mt-auto border-t border-slate-200 pt-4 flex justify-between text-[10px] text-slate-400 uppercase print:mt-8">
                <span>Patricio Turismo</span>
                <span>{new Date().toLocaleString()}</span>
            </div>
        </div>
    );
};

// === COMPONENTE PRINCIPAL ===
export default function TaxistaReportPage() {
    const { id: tripId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [passengers, setPassengers] = useState<any[]>([]);
    const [trip, setTrip] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [printConfig, setPrintConfig] = useState<{ id: number | 'ALL', type: ReportType } | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [tripRes, paxRes] = await Promise.all([
                    api.get(`/api/viagem/${tripId}`),
                    api.get(`/api/passageiroviagem/viagem/${tripId}`)
                ]);
                setTrip(tripRes.data);
                
                const paxWithBags = await Promise.all(paxRes.data.map(async (p: any) => {
                    if (!p.bagagens || p.bagagens.length === 0) {
                        try {
                            const b = await api.get(`/api/bagagem/passageiro/${p.id}`);
                            return { ...p, bagagens: b.data };
                        } catch { return p; }
                    }
                    return p;
                }));
                
                setPassengers(paxWithBags);
            } catch (error) {
                console.error(error);
                alert("Erro ao carregar dados");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tripId]);

    const handlePrint = (targetId: number | 'ALL', type: ReportType) => {
        setPrintConfig({ id: targetId, type });
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const groupedData = useMemo(() => {
        const map = new Map<number, any>();
        passengers.forEach(p => {
            if (p.taxistaColeta) {
                const tid = p.taxistaColeta.id;
                if (!map.has(tid)) map.set(tid, { id: tid, taxista: p.taxistaColeta.pessoa, coletas: [], entregas: [] });
                map.get(tid).coletas.push(p);
            }
            if (p.taxistaEntrega) {
                const tid = p.taxistaEntrega.id;
                if (!map.has(tid)) map.set(tid, { id: tid, taxista: p.taxistaEntrega.pessoa, coletas: [], entregas: [] });
                map.get(tid).entregas.push(p);
            }
        });
        return Array.from(map.values()).sort((a, b) => a.taxista.nome.localeCompare(b.taxista.nome));
    }, [passengers]);

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('pt-BR');
    const tripInfo = { id: tripId || '', date: trip ? formatDate(trip.dataHoraPartida) : '' };

    if (loading) return <div className="p-8 text-center">Carregando relatório...</div>;

    return (
        <div className="bg-orange-50/30 min-h-screen p-8 text-slate-900 print:p-0 print:bg-white print:min-h-0">
            
            {/* CSS Global para Impressão */}
            <style>
                {`
                    @media print {
                        @page { margin: 1cm; size: auto; }
                        body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                `}
            </style>

            {/* --- CONTROLES DE TELA --- */}
            <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate(-1)} className="bg-white border-orange-100 hover:bg-orange-50 text-slate-700">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Relatórios de Taxistas</h1>
                        <p className="text-sm text-slate-500">{groupedData.length} motoristas vinculados</p>
                    </div>
                </div>
                
                {/* Botões de Ação em Massa - Estilo Laranja */}
                <div className="flex gap-2">
                    <Button onClick={() => handlePrint('ALL', 'COLETA')} className="bg-slate-800 hover:bg-slate-900 text-white border border-slate-900 shadow-sm">
                        <Printer className="w-4 h-4 mr-2" /> Todas Coletas
                    </Button>
                    <Button onClick={() => handlePrint('ALL', 'ENTREGA')} className="bg-slate-800 hover:bg-slate-900 text-white border border-slate-900 shadow-sm">
                        <Printer className="w-4 h-4 mr-2" /> Todas Entregas
                    </Button>
                </div>
            </div>

            {/* --- LISTA DE CARTÕES --- */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 gap-4 print:hidden">
                {groupedData.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-white shadow-sm rounded border border-orange-100">Nenhum taxista vinculado nesta viagem.</div>
                ) : (
                    groupedData.map((group) => (
                        <div key={group.id} className="bg-white shadow-sm border border-orange-100 rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md hover:border-orange-200 transition-all">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                                    <Car className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{group.taxista.nome}</h3>
                                    <div className="flex gap-4 text-sm text-slate-500">
                                        <span className={group.coletas.length > 0 ? "text-slate-700 font-medium" : "text-slate-300"}>
                                            {group.coletas.length} Coletas
                                        </span>
                                        <span className={group.entregas.length > 0 ? "text-slate-700 font-medium" : "text-slate-300"}>
                                            {group.entregas.length} Entregas
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={group.coletas.length === 0}
                                    onClick={() => handlePrint(group.id, 'COLETA')} 
                                    className="flex-1 md:flex-none border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-slate-600"
                                >
                                    <Download className="w-4 h-4 mr-2 text-orange-600" /> Coleta
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled={group.entregas.length === 0}
                                    onClick={() => handlePrint(group.id, 'ENTREGA')} 
                                    className="flex-1 md:flex-none border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-slate-600"
                                >
                                    <Download className="w-4 h-4 mr-2 text-amber-600" /> Entrega
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- ÁREA DE IMPRESSÃO (Escondida na tela) --- */}
            <div className="hidden print:block">
                {groupedData.map((group, index) => {
                    if (!printConfig) return null;
                    const isTarget = printConfig.id === 'ALL' || printConfig.id === group.id;
                    if (!isTarget) return null;

                    const hasData = printConfig.type === 'COLETA' ? group.coletas.length > 0 : group.entregas.length > 0;
                    
                    if (printConfig.id === 'ALL' && !hasData) return null;

                    const shouldBreak = index < groupedData.length - 1;

                    return (
                        <div 
                            key={`${group.id}-${printConfig.type}`} 
                            className={cn("print:h-auto print:p-0", shouldBreak && "print:break-after-page")}
                        >
                            <PrintSheet data={group} tripInfo={tripInfo} type={printConfig.type} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}