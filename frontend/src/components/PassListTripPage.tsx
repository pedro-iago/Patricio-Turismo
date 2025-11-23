import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, CheckSquare, Square, MapPin, Save, Car, Link as LinkIcon, X, 
    Phone, Armchair, Briefcase, User, Printer, Package 
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import api from '../services/api';
import { cn } from './ui/utils';

interface Bus { id: number; placa: string; modelo: string; }
interface Affiliate { id: number; pessoa: { nome: string }; }
interface Bagagem { id: number; descricao: string; peso?: number; }

// Interface Unificada (Item da Lista)
interface ListItem {
    uniqueId: string; // "p-1" ou "e-5"
    originalId: number;
    type: 'PASSENGER' | 'PACKAGE';
    name: string;
    phone?: string;
    address?: { cidade: string; bairro?: string; logradouro?: string };
    taxista?: Affiliate;
    
    // Campos específicos
    grupoId?: string;
    bagagens?: Bagagem[]; 
    descricaoEncomenda?: string;
    
    // Badge info
    numeroAssento?: string;
    onibus?: Bus | null;
    comisseiro?: Affiliate;
    ordem: number;
}

export default function PassListTripPage() {
    const { id: tripId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // Estados de Dados
    const [rawPassengers, setRawPassengers] = useState<any[]>([]);
    const [rawPackages, setRawPackages] = useState<any[]>([]);
    const [taxistas, setTaxistas] = useState<Affiliate[]>([]);
    const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());
    const [loading, setLoading] = useState(true);

    // Estados de Controle
    const [selectedUniqueIds, setSelectedUniqueIds] = useState<string[]>([]);
    const [selectedTaxistaId, setSelectedTaxistaId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'coleta' | 'entrega'>('coleta');

    useEffect(() => { fetchData(); }, [tripId]);

    const fetchData = async () => {
        if (!tripId) return;
        setLoading(true);
        try {
            const [tripRes, paxRes, pkgRes, taxRes] = await Promise.all([
                api.get(`/api/viagem/${tripId}`),
                api.get(`/api/passageiroviagem/viagem/${tripId}`),
                api.get(`/api/v1/reports/encomendas/viagem/${tripId}`), // Busca encomendas
                api.get('/api/v1/affiliates/taxistas')
            ]);
            
            // Mapeia Ônibus
            const map = new Map<number, Bus>();
            if (tripRes.data && tripRes.data.onibus) {
                tripRes.data.onibus.forEach((b: Bus) => map.set(b.id, b));
            }
            setBusMap(map);

            // Carrega Bagagens (Detalhes)
            const passengersWithDetails = await Promise.all(
                paxRes.data.map(async (p: any) => {
                    let bagagens: Bagagem[] = p.bagagens || [];
                    if (!bagagens.length) {
                        try {
                            const bagRes = await api.get(`/api/bagagem/passageiro/${p.id}`);
                            bagagens = bagRes.data;
                        } catch (e) { bagagens = []; }
                    }
                    return { ...p, bagagens };
                })
            );

            setRawPassengers(passengersWithDetails);
            setRawPackages(pkgRes.data);
            setTaxistas(taxRes.data.content || taxRes.data);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
    };

    // Conta membros de grupos (apenas passageiros)
    const groupCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        rawPassengers.forEach(p => {
            if (p.grupoId) counts[p.grupoId] = (counts[p.grupoId] || 0) + 1;
        });
        return counts;
    }, [rawPassengers]);

    // === PROCESSAMENTO E UNIFICAÇÃO DA LISTA ===
    const groupedItems = useMemo(() => {
        const items: ListItem[] = [];

        // 1. Adiciona Passageiros
        rawPassengers.forEach(p => {
            const isColeta = activeTab === 'coleta';
            const addr = isColeta ? p.enderecoColeta : p.enderecoEntrega;
            const bus = p.onibusId ? busMap.get(p.onibusId) : null;

            items.push({
                uniqueId: `p-${p.id}`,
                originalId: p.id,
                type: 'PASSENGER',
                name: p.pessoa.nome,
                phone: p.pessoa.telefone,
                address: addr,
                taxista: isColeta ? p.taxistaColeta : p.taxistaEntrega,
                grupoId: p.grupoId,
                bagagens: p.bagagens,
                numeroAssento: p.numeroAssento,
                onibus: bus,
                comisseiro: p.comisseiro,
                ordem: p.ordem || 0
            });
        });

        // 2. Adiciona Encomendas
        rawPackages.forEach(pkg => {
            const isColeta = activeTab === 'coleta';
            const addr = isColeta ? pkg.enderecoColeta : pkg.enderecoEntrega;
            const person = isColeta ? pkg.remetente : pkg.destinatario;

            items.push({
                uniqueId: `e-${pkg.id}`,
                originalId: pkg.id,
                type: 'PACKAGE',
                name: person?.nome || 'Desconhecido',
                phone: person?.telefone,
                address: addr,
                taxista: isColeta ? pkg.taxistaColeta : pkg.taxistaEntrega,
                descricaoEncomenda: pkg.descricao,
                comisseiro: pkg.comisseiro,
                // Encomendas vão para o final da lista visualmente
                ordem: (pkg.ordem || 999) + 1000 
            });
        });

        // 3. Ordena
        items.sort((a, b) => a.ordem - b.ordem);

        // 4. Agrupa por Cidade
        const groups: Record<string, ListItem[]> = {};
        items.forEach(item => {
            const cityKey = item.address?.cidade || 'Cidade não informada';
            if (!groups[cityKey]) groups[cityKey] = [];
            groups[cityKey].push(item);
        });

        return Object.keys(groups).sort().reduce(
            (obj, key) => { obj[key] = groups[key]; return obj; }, 
            {} as Record<string, ListItem[]>
        );

    }, [rawPassengers, rawPackages, activeTab, busMap]);

    // === LÓGICA DE SELEÇÃO INTELIGENTE ===
    const toggleSelect = (targetItem: ListItem) => {
        let idsToToggle = [targetItem.uniqueId];

        // Se for passageiro e tiver grupo (família), seleciona todos
        if (targetItem.type === 'PASSENGER' && targetItem.grupoId) {
            const groupSize = groupCounts[targetItem.grupoId] || 0;
            if (groupSize > 1) {
                const relatedIds = rawPassengers
                    .filter(p => p.grupoId === targetItem.grupoId)
                    .map(p => `p-${p.id}`);
                idsToToggle = relatedIds;
            }
        }

        setSelectedUniqueIds(prev => {
            const isSelected = prev.includes(targetItem.uniqueId);
            if (isSelected) {
                return prev.filter(id => !idsToToggle.includes(id));
            } else {
                const newIds = idsToToggle.filter(id => !prev.includes(id));
                return [...prev, ...newIds];
            }
        });
    };

    const toggleSelectGroup = (list: ListItem[]) => {
        const ids = list.map(i => i.uniqueId);
        const allSelected = ids.every(id => selectedUniqueIds.includes(id));
        if (allSelected) {
            setSelectedUniqueIds(prev => prev.filter(id => !ids.includes(id)));
        } else {
            setSelectedUniqueIds(prev => [...new Set([...prev, ...ids])]);
        }
    };

    // === ENVIO PARA O BACKEND (ATUALIZADO) ===
    const handleBulkAssign = async () => {
        if (selectedUniqueIds.length === 0) return;
        
        const taxistaIdToSend = (selectedTaxistaId && selectedTaxistaId !== 'remove') 
            ? parseInt(selectedTaxistaId) 
            : null;

        const tipoEnvio = activeTab === 'coleta' ? 'COLETA' : 'ENTREGA';

        // Separa os IDs (Passageiros vs Encomendas)
        const passageiroIds: number[] = [];
        const encomendaIds: number[] = [];

        selectedUniqueIds.forEach(uid => {
            const [type, idStr] = uid.split('-');
            const id = parseInt(idStr);
            if (type === 'p') passageiroIds.push(id);
            if (type === 'e') encomendaIds.push(id);
        });

        try {
            await api.post('/api/passageiroviagem/atribuir-massa', {
                passageiroIds: passageiroIds,
                encomendaIds: encomendaIds, // Envia a lista separada para o backend
                taxistaId: taxistaIdToSend,
                tipo: tipoEnvio
            });
            
            setSelectedUniqueIds([]);
            setSelectedTaxistaId('');
            await fetchData();
        } catch (error) {
            console.error("Erro ao atribuir", error);
            alert("Erro ao salvar.");
        }
    };

    const getAddressText = (item: ListItem) => {
        if (!item.address) return <span className="text-red-400 italic">Sem endereço</span>;
        return `${item.address.logradouro || ''}, ${item.address.bairro || ''}`;
    };

    return (
        <div className="pb-32 space-y-4">
            <div className="flex items-center justify-between mb-2 bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/trips/${tripId}`)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Car className="w-5 h-5 text-orange-500" /> Passar Lista
                        </h2>
                        <p className="text-sm text-muted-foreground">Defina os taxistas da viagem</p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => navigate(`/trips/${tripId}/relatorio-taxistas`)}
                    className="gap-2"
                >
                    <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Relatório PDF</span>
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setSelectedUniqueIds([]); }} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="coleta">1. Coleta (Saída)</TabsTrigger>
                    <TabsTrigger value="entrega">2. Entrega (Chegada)</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6">
                    {Object.entries(groupedItems).map(([city, itemsList]) => {
                        const allSelected = itemsList.every(item => selectedUniqueIds.includes(item.uniqueId));
                        
                        return (
                            <Card key={city} className="border-l-4 border-l-orange-400 shadow-sm">
                                <CardHeader className="py-3 bg-slate-50/80 border-b flex flex-row items-center justify-between cursor-pointer hover:bg-slate-100" onClick={() => toggleSelectGroup(itemsList)}>
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        {city} 
                                        <span className="text-xs font-normal text-muted-foreground bg-white px-2 py-0.5 rounded-full border ml-2">
                                            {itemsList.length}
                                        </span>
                                    </CardTitle>
                                    {allSelected ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5 text-muted-foreground" />}
                                </CardHeader>
                                <CardContent className="p-0">
                                    {itemsList.map((item, idx) => {
                                        const isSelected = selectedUniqueIds.includes(item.uniqueId);
                                        
                                        // Lógica Visual de Grupo (Só Passageiros)
                                        const groupSize = item.grupoId ? groupCounts[item.grupoId] || 0 : 0;
                                        const hasGroup = item.type === 'PASSENGER' && groupSize > 1;

                                        const prev = itemsList[idx - 1];
                                        const next = itemsList[idx + 1];
                                        const isGroupStart = hasGroup && (!prev || prev.grupoId !== item.grupoId);
                                        const isGroupEnd = hasGroup && (!next || next.grupoId !== item.grupoId);

                                        // Dados
                                        const bagCount = item.bagagens ? item.bagagens.length : 0;
                                        const bagDescription = item.bagagens?.map((b: any) => b.descricao).join(', ');

                                        return (
                                            <div 
                                                key={item.uniqueId} 
                                                className={cn(
                                                    "flex items-start gap-3 p-3 cursor-pointer transition-colors relative",
                                                    !isSelected && "hover:bg-slate-50",
                                                    isSelected && "bg-orange-100/50",
                                                    
                                                    // Fundo azul claro para encomendas
                                                    item.type === 'PACKAGE' && !isSelected && "bg-blue-50/30",

                                                    hasGroup && [
                                                        "bg-orange-50/30",
                                                        "border-l-[4px] border-l-orange-300 pl-2", 
                                                        "border-r border-orange-200", 
                                                        isGroupStart && "border-t border-orange-200 mt-2 rounded-tr-md",
                                                        isGroupEnd && "border-b border-orange-200 mb-2 rounded-br-md",
                                                        !isGroupEnd && "border-b-0",
                                                        !isGroupStart && "mt-0" 
                                                    ],
                                                    !hasGroup && "border-b border-slate-100 pl-3"
                                                )}
                                                onClick={() => toggleSelect(item)}
                                            >
                                                <Checkbox checked={isSelected} className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                                                
                                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                    {/* LINHA 1 */}
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            {hasGroup && <LinkIcon className="w-3 h-3 text-orange-400 shrink-0" title="Vinculado" />}
                                                            
                                                            {item.type === 'PACKAGE' && <Package className="w-4 h-4 text-blue-500 shrink-0" />}
                                                            
                                                            <span className={cn("font-bold text-sm truncate", item.type === 'PACKAGE' ? "text-blue-700" : "text-slate-800")}>
                                                                {item.name}
                                                            </span>
                                                            
                                                            {item.type === 'PACKAGE' && (
                                                                <span className="text-[9px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 rounded border border-blue-200">Encomenda</span>
                                                            )}
                                                        </div>
                                                        {item.phone && (
                                                            <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                                                                <Phone className="w-3 h-3" /><span>{item.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* LINHA 2 */}
                                                    <p className="text-xs text-muted-foreground truncate border-l-2 pl-2 border-slate-200">
                                                        {getAddressText(item)}
                                                    </p>

                                                    {/* LINHA 3: Badges */}
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        
                                                        {item.type === 'PACKAGE' && item.descricaoEncomenda && (
                                                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[250px]">
                                                                📦 {item.descricaoEncomenda}
                                                            </span>
                                                        )}

                                                        {(item.numeroAssento || item.onibus) && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                                <Armchair className="w-3 h-3" /> 
                                                                {item.numeroAssento || '?'} 
                                                                {item.onibus && <span className="text-blue-300 mx-0.5">|</span>}
                                                                {item.onibus && <span>{item.onibus.placa}</span>}
                                                            </span>
                                                        )}

                                                        {bagCount > 0 && (
                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 w-fit">
                                                                <Briefcase className="w-3 h-3 shrink-0" /> 
                                                                <span className="font-bold">{bagCount}</span>
                                                                <span className="text-slate-500 border-l border-slate-300 pl-1.5 ml-0.5">
                                                                    {bagDescription}
                                                                </span>
                                                            </span>
                                                        )}

                                                        {item.comisseiro && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                                                                <User className="w-3 h-3" /> {item.comisseiro.pessoa.nome}
                                                            </span>
                                                        )}

                                                        <div className="ml-auto">
                                                            {item.taxista ? (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                                                    <Car className="w-3 h-3" /> {item.taxista.pessoa.nome}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                                                                    Pendente
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>
            </Tabs>

            {selectedUniqueIds.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:w-[600px] md:-translate-x-1/2 bg-white text-slate-900 p-4 rounded-xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-10 z-50 border border-slate-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-sm text-slate-600">
                            <b className="text-slate-900">{selectedUniqueIds.length}</b> itens selecionados
                        </span>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-6 text-slate-500 hover:text-slate-900 hover:bg-slate-100" 
                            onClick={() => setSelectedUniqueIds([])}
                        >
                            <X className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                    </div>
                    
                    <div className="flex gap-2">
                        <Select value={selectedTaxistaId} onValueChange={setSelectedTaxistaId}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-10 focus:ring-orange-500">
                                <SelectValue placeholder="Escolha o Taxista..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                                <SelectItem value="remove" className="text-red-500 focus:text-red-600 focus:bg-red-50 font-medium">
                                    (Remover Taxista)
                                </SelectItem>
                                {taxistas.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()} className="focus:bg-slate-100 cursor-pointer">
                                        {t.pessoa.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Button onClick={handleBulkAssign} className="bg-orange-500 hover:bg-orange-600 text-white px-6 shadow-sm">
                            <Save className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Salvar</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}