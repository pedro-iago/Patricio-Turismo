import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Printer, FileDown, X, Calendar, Clock, Bus as BusIcon, Users, Package, 
  PanelRightClose, PanelRightOpen, Map as MapIcon, List as ListIcon, Check, ChevronsUpDown,
  Car, UserCheck, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import PassengerModal from './PassengerModal';
import PackageModal from './PackageModal';
import LuggageModal from './LuggageModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import api from '../services/api';
import { CSVLink } from 'react-csv'; 
import { cn, normalizeString } from './ui/utils';
import PassengerOrganizer, { Cidade as CidadeDnD } from '../components/PassengerOrganizer';
import PackageTable from './PackageTable';
import SeatMap from './SeatMap'; 
import SeatBinderModal from './SeatBinderModal';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { toast } from 'sonner';
// Importação condicional para manter compatibilidade caso use o modo tabela
import PassengerTable, { PassengerData } from './PassengerTable';

// --- NOVO IMPORT: MODAL DE FAMÍLIA ---
import FamilyPassengerModal from './FamilyPassengerModal';

// --- UTILS ---
const FilterCombobox = ({ options, value, onChange, placeholder, width = "w-full" }: any) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(() => {
    if (!value || value === 'todos') return placeholder;
    const found = options.find((opt: any) => opt.value === value);
    return found ? found.label : value;
  }, [value, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={`${width} justify-between bg-background text-xs h-9 font-normal`}>
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder}...`} />
          <CommandList>
            <CommandEmpty>Não encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="todos" onSelect={() => { onChange("todos"); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", value === "todos" ? "opacity-100" : "opacity-0")} />Todos (Limpar)</CommandItem>
              {options.map((option: any) => (<CommandItem key={option.value} value={option.label} onSelect={() => { onChange(option.value); setOpen(false); }}><Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />{option.label}</CommandItem>))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- INTERFACES ---
interface Bus { id: number; modelo: string; placa: string; apelido?: string; capacidadePassageiros: number; layoutJson?: string; }
interface TripDto { id: number; dataHoraPartida: string; dataHoraChegada: string; onibus: Bus[]; }
interface PassengerSaveDto { pessoaId: number; enderecoColetaId: number; enderecoEntregaId: number; taxistaColetaId?: number; taxistaEntregaId?: number; comisseiroId?: number; valor?: number; metodoPagamento?: string; pago?: boolean; assentoId?: number | null; }
interface PackageSaveDto { descricao: string; remetenteId: number; destinatarioId: number; enderecoColetaId: number; enderecoEntregaId: number; taxistaColetaId?: number; taxistaEntregaId?: number; comisseiroId?: number; valor?: number; metodoPagamento?: string; pago?: boolean; }
interface PackageData { id: number; descricao: string; remetente: { id: number, nome: string; telefone?: string }; destinatario: { id: number, nome: string; telefone?: string }; enderecoColeta?: { id: number; cidade?: string }; enderecoEntrega?: { id: number; cidade?: string }; taxistaColeta?: any; taxistaEntrega?: any; comisseiro?: any; valor?: number; pago?: boolean; [key: string]: any; }

export default function TripDetailsPage() {
    const { id: tripId } = useParams<{ id: string }>();
    const tripIdNum = parseInt(tripId!); 
    const navigate = useNavigate(); 

    const [trip, setTrip] = useState<TripDto | null>(null);
    const [busMap, setBusMap] = useState<Map<number, Bus>>(new Map());
    const [passengers, setPassengers] = useState<PassengerData[]>([]);
    
    // ESTADOS UNIFICADOS
    const [hierarchicalData, setHierarchicalData] = useState<CidadeDnD[]>([]);
    const [organizeMode, setOrganizeMode] = useState<'padrao' | 'cidade' | 'taxista' | 'comisseiro'>('padrao');
    const [cityGroupBy, setCityGroupBy] = useState<'coleta' | 'entrega'>('coleta'); 

    const [packages, setPackages] = useState<PackageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [currentBusId, setCurrentBusId] = useState<number | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(true);
    const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
    
    // Modais
    const [isSeatBinderModalOpen, setIsSeatBinderModalOpen] = useState(false);
    const [seatTargetId, setSeatTargetId] = useState<number | null>(null); 
    const [seatTargetNumber, setSeatTargetNumber] = useState('');
    const [passengerToDesassociate, setPassengerToDesassociate] = useState<PassengerData | null>(null); 
    const [availablePassengers, setAvailablePassengers] = useState<PassengerData[]>([]); 
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    
    // --- ESTADOS DO MODAL FAMÍLIA ---
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null); // Armazena dados do grupo para edição
    
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState<PassengerData | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
    const [deleteItem, setDeleteItem] = useState<{ type: 'passenger' | 'package'; item: any } | null>(null);
    const [passengerToUnlink, setPassengerToUnlink] = useState<PassengerData | null>(null);

    // Filtros
    const [filterTaxista, setFilterTaxista] = useState<string>("todos");
    const [filterComisseiro, setFilterComisseiro] = useState<string>("todos");
    const [filterOnibus, setFilterOnibus] = useState<string>("todos");
    const [filterCidade, setFilterCidade] = useState<string>("todos");
    const [passengerSearchTerm, setPassengerSearchTerm] = useState('');
    const [packageSearchTerm, setPackageSearchTerm] = useState('');
    
    // FETCH INITIAL
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!tripIdNum || isNaN(tripIdNum)) { setLoading(false); return; }
            setLoading(true);
            try {
                const response = await api.get<TripDto>(`/api/viagem/${tripIdNum}`);
                const tripData = response.data;
                setTrip(tripData);
                const newBusMap = new Map<number, Bus>();
                if (tripData.onibus) {
                    tripData.onibus.forEach(bus => newBusMap.set(bus.id, bus));
                    if (tripData.onibus.length > 0) setCurrentBusId(tripData.onibus[0].id);
                }
                setBusMap(newBusMap);
            } catch (error) { console.error('Erro ao buscar detalhes:', error); setTrip(null); } 
            finally { setLoading(false); }
        };
        fetchInitialData();
    }, [tripIdNum]);

    // FETCH DATA
    const fetchFilteredData = useCallback(async () => {
        if (!tripIdNum || isNaN(tripIdNum)) return;
        try {
            setLoading(true); 
            const [passengersResponse, packagesResponse] = await Promise.all([
                api.get<PassengerData[]>(`/api/passageiroviagem/viagem/${tripIdNum}`), 
                api.get<PackageData[]>(`/api/v1/reports/encomendas/viagem/${tripIdNum}`)     
            ]);
            
            const passengersData = passengersResponse.data;
            const passengersWithLuggage = passengersData.map((passenger) => { 
                const realOnibusId = passenger.onibusId || (passenger.onibus && passenger.onibus.id);
                const bagagensList = passenger['bagagens'] || passenger['volumes'] || [];
                const luggageCount = bagagensList.length;
                return { 
                    ...passenger, 
                    luggageCount, 
                    bagagens: bagagensList, 
                    onibusId: realOnibusId ? Number(realOnibusId) : null 
                };
            });
            
            setPassengers(passengersWithLuggage);
            setPackages(packagesResponse.data); 
            setAvailablePassengers(passengersWithLuggage.filter(p => !p.numeroAssento));
        } catch (error) { console.error('Erro ao buscar dados:', error); } 
        finally { setLoading(false); }
    }, [tripIdNum]);
    
    useEffect(() => { fetchFilteredData(); }, [fetchFilteredData]);

    const displayedPassengers = useMemo(() => {
        let list = passengers.filter((passenger) => {
            const searchLower = passengerSearchTerm.toLowerCase();
            const matchesSearch = !searchLower || passenger.pessoa.nome.toLowerCase().includes(searchLower);
            const matchesTaxista = filterTaxista === "todos" || passenger.taxistaColeta?.pessoa?.nome === filterTaxista || passenger.taxistaEntrega?.pessoa?.nome === filterTaxista;
            const matchesComisseiro = filterComisseiro === "todos" || passenger.comisseiro?.pessoa?.nome === filterComisseiro;
            const matchesOnibus = filterOnibus === "todos" || String(passenger.onibusId) === filterOnibus;
            const matchesCidade = filterCidade === "todos" || passenger.enderecoColeta?.cidade === filterCidade || passenger.enderecoEntrega?.cidade === filterCidade;
            return matchesSearch && matchesTaxista && matchesComisseiro && matchesOnibus && matchesCidade;
        });

        if (organizeMode === 'padrao') {
             return [...list].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        }
        else if (organizeMode !== 'cidade') {
            return [...list].sort((a, b) => {
                if (organizeMode === 'taxista') return normalizeString(a.taxistaColeta?.pessoa.nome).localeCompare(normalizeString(b.taxistaColeta?.pessoa.nome));
                if (organizeMode === 'comisseiro') return normalizeString(a.comisseiro?.pessoa.nome).localeCompare(normalizeString(b.comisseiro?.pessoa.nome));
                return 0;
            });
        }
        return list; 
    }, [passengers, organizeMode, passengerSearchTerm, filterTaxista, filterComisseiro, filterOnibus, filterCidade]);

    // TRANSFORMAÇÃO DE DADOS
    useEffect(() => {
        if (displayedPassengers.length === 0) {
            setHierarchicalData([]);
            return;
        }

        const mapaCidades = new Map<string, CidadeDnD>();

        displayedPassengers.forEach(p => {
            let nomeCidade = "";
            let nomeBairro = "";
            let cidadeId = "";
            let bairroId = "";

            if (organizeMode === 'cidade') {
                const targetAddress = cityGroupBy === 'coleta' ? p.enderecoColeta : p.enderecoEntrega;
                nomeCidade = targetAddress?.cidade || 'Sem Cidade';
                nomeBairro = targetAddress?.bairro || 'Geral';
                cidadeId = `cid-${normalizeString(nomeCidade)}`;
            } else if (organizeMode === 'padrao') {
                nomeCidade = "Lista de Passageiros";
                nomeBairro = "Geral";
                cidadeId = "root-padrao";
            } else if (organizeMode === 'taxista') {
                nomeCidade = p.taxistaColeta?.pessoa?.nome || "Sem Taxista";
                nomeBairro = "Passageiros";
                cidadeId = `tax-${normalizeString(nomeCidade)}`;
            } else if (organizeMode === 'comisseiro') {
                nomeCidade = p.comisseiro?.pessoa?.nome || "Sem Comisseiro";
                nomeBairro = "Passageiros";
                cidadeId = `com-${normalizeString(nomeCidade)}`;
            }

            bairroId = `bairro-${cidadeId}-${normalizeString(nomeBairro)}`;

            if (!mapaCidades.has(cidadeId)) {
                mapaCidades.set(cidadeId, { id: cidadeId, nome: nomeCidade, bairros: [] });
            }
            const cidadeObj = mapaCidades.get(cidadeId)!;

            let bairroObj = cidadeObj.bairros.find(b => b.id === bairroId);
            if (!bairroObj) {
                bairroObj = { id: bairroId, nome: nomeBairro, groups: [] };
                cidadeObj.bairros.push(bairroObj);
            }

            const onibusCompleto = p.onibus || (p.onibusId ? busMap.get(Number(p.onibusId)) : null);
            const tel = p.pessoa.telefone || (p.pessoa.telefones ? p.pessoa.telefones[0] : '') || p.pessoa['celular'];
            const doc = p.pessoa.documento || p.pessoa.cpf || p.pessoa.rg;
            const bag = p.luggageCount || (p['bagagens']?.length || 0);
            
            const linkId = p.grupoId || p.ligacaoId;
            const manualColor = p.corTag; 

            const passageiroObj = {
                id: String(p.id),
                nome: p.pessoa.nome,
                displayDoc: doc || 'S/ Doc',
                displayTel: tel || 'S/ Tel',
                displayLuggage: bag,
                linkColor: manualColor,
                dadosCompletos: {
                    ...p,
                    onibus: onibusCompleto,
                    luggageCount: bag
                }
            };

            let targetGroup = null;
            if (linkId) {
                targetGroup = bairroObj.groups.find(g => 
                    g.items.some(item => (item.dadosCompletos.grupoId === linkId || item.dadosCompletos.ligacaoId === linkId))
                );
            }

            if (targetGroup) {
                targetGroup.items.push(passageiroObj);
            } else {
                bairroObj.groups.push({
                    id: linkId ? `group-${linkId}` : `single-${p.id}`,
                    items: [passageiroObj]
                });
            }
        });

        const dadosHierarquicos = Array.from(mapaCidades.values());

        if (organizeMode !== 'padrao') {
             dadosHierarquicos.sort((a, b) => a.nome.localeCompare(b.nome));
        }
        
        dadosHierarquicos.forEach(cidade => {
            cidade.bairros.forEach(bairro => {
                bairro.groups.forEach(group => {
                    group.items.sort((a, b) => {
                         if (organizeMode === 'cidade') {
                             const ordA = a.dadosCompletos.ordemCidade ?? Number.MAX_SAFE_INTEGER;
                             const ordB = b.dadosCompletos.ordemCidade ?? Number.MAX_SAFE_INTEGER;
                             if (ordA !== Number.MAX_SAFE_INTEGER || ordB !== Number.MAX_SAFE_INTEGER) return ordA - ordB;
                         }
                         return (a.dadosCompletos.ordem || 0) - (b.dadosCompletos.ordem || 0);
                    });
                });
            });
        });

        setHierarchicalData(dadosHierarquicos);

    }, [displayedPassengers, organizeMode, busMap, cityGroupBy]);

    const handleHierarchicalChange = async (newData: CidadeDnD[]) => { 
        setHierarchicalData(newData); 
        const orderedIds: number[] = [];
        newData.forEach(cidade => {
            cidade.bairros.forEach(bairro => {
                bairro.groups.forEach(group => {
                    group.items.forEach(p => { orderedIds.push(parseInt(p.id)); });
                });
            });
        });

        try {
            if (organizeMode === 'cidade') {
                await api.patch('/api/passageiroviagem/reordenar-cidade', { ids: orderedIds });
            } else if (organizeMode === 'padrao') {
                await api.patch('/api/passageiroviagem/reordenar', { ids: orderedIds });
            }
        } catch (error) { 
            console.error("Erro no auto-save:", error); 
            toast.error("Erro ao salvar a nova ordem.");
        }
    };
    
    // Handlers
    const handleColorChange = async (passengerId: number, color: string | null) => {
        try {
            const targetPassenger = passengers.find(p => p.id === passengerId);
            if (targetPassenger && targetPassenger.grupoId) {
                const groupMembers = passengers.filter(p => p.grupoId === targetPassenger.grupoId);
                const promises = groupMembers.map(member => 
                    api.patch(`/api/passageiroviagem/${member.id}/cor`, { cor: color })
                );
                await Promise.all(promises);
            } else {
                await api.patch(`/api/passageiroviagem/${passengerId}/cor`, { cor: color });
            }
            fetchFilteredData(); 
        } catch (error) { console.error("Erro ao salvar cor:", error); toast.error("Erro ao alterar cor."); }
    };

    const handleSyncToDefault = async () => {
        if (!confirm("Isso irá sobrescrever a ordem da lista 'Padrão' para ficar igual a esta visualização por Cidades. Deseja continuar?")) return;
        if (isSavingOrder) return;
        setIsSavingOrder(true);
        try {
            const orderedIds: number[] = [];
            hierarchicalData.forEach(cidade => {
                cidade.bairros.forEach(bairro => {
                    bairro.groups.forEach(group => {
                        group.items.forEach(p => { orderedIds.push(parseInt(p.id)); });
                    });
                });
            });
            await api.patch('/api/passageiroviagem/reordenar', { ids: orderedIds });
            await fetchFilteredData();
            toast.success("Ordem Padrão atualizada com sucesso!");
        } catch (error) { console.error(error); toast.error("Erro ao sincronizar ordem."); } 
        finally { setIsSavingOrder(false); }
    };
    
    const handleModeChange = (mode: 'padrao' | 'cidade' | 'taxista' | 'comisseiro') => {
        setOrganizeMode(mode);
        if (mode === 'padrao') fetchFilteredData(); 
    };

    const handleLinkPassengers = async (current: any, previous: any) => { 
        try { 
            const currId = typeof current.id === 'string' ? parseInt(current.id) : current.id;
            const prevId = typeof previous.id === 'string' ? parseInt(previous.id) : previous.id;
            if (!currId || !prevId) return;
            await api.post(`/api/passageiroviagem/${currId}/vincular/${prevId}`); 
            await fetchFilteredData(); 
        } catch (e) { console.error(e); alert("Erro ao vincular."); } 
    };
    
    const handleUnlinkPassenger = (p: any) => { const realPassenger = p.dadosCompletos || p; setPassengerToUnlink(realPassenger); };
    const confirmUnlinkGroup = async () => { 
        if (passengerToUnlink) { 
            try { await api.post(`/api/passageiroviagem/${passengerToUnlink.id}/desvincular`); await fetchFilteredData(); setPassengerToUnlink(null); 
            } catch (e) { console.error(e); alert("Erro ao desvincular."); }
        } 
    };
    const handleSelectSeat = (identifier: number, seatNumber: string, isOccupied: boolean) => {
        setSeatTargetId(identifier); setSeatTargetNumber(seatNumber); 
        if (isOccupied) {
            let passenger = passengers.find(p => p.id === identifier);
            if (!passenger) passenger = passengers.find(p => { const seatA = parseInt(p.numeroAssento || '0', 10); const seatB = parseInt(seatNumber || '0', 10); return seatA === seatB && p.onibusId === currentBusId; });
            if (passenger) setPassengerToDesassociate(passenger);
        } else { setIsSeatBinderModalOpen(true); }
    };
    const updatePassengerAssento = async (passengerId: number, seatIdentifier: string | null, isUnbind: boolean = false) => {
        if (!currentBusId && !isUnbind) { alert("Erro: Nenhum ônibus selecionado."); return; }
        try {
            const params = new URLSearchParams();
            let busIdToUse = currentBusId;
            if (isUnbind) { const p = passengers.find(px => px.id === passengerId); if (p && p.onibusId) busIdToUse = p.onibusId; }
            if (busIdToUse) params.append('onibusId', busIdToUse.toString());
            if (!isUnbind && seatIdentifier) params.append('numero', parseInt(seatIdentifier, 10).toString());
            await api.patch(`/api/passageiroviagem/${passengerId}/vincular-assento?${params.toString()}`);
            setIsSeatBinderModalOpen(false); setPassengerToDesassociate(null); setSeatTargetId(null); await fetchFilteredData(); 
        } catch (error) { console.error(error); alert("Erro ao vincular/desvincular assento."); }
    }
    const handleBindPassenger = (pid: number) => updatePassengerAssento(pid, seatTargetNumber, false);
    const handleDesassociateConfirm = () => passengerToDesassociate && updatePassengerAssento(passengerToDesassociate.id, null, true);
    const handleSavePassenger = async (dto: PassengerSaveDto) => { if (!tripIdNum) return; try { if (selectedPassenger) await api.put(`/api/passageiroviagem/${selectedPassenger.id}`, { ...dto, viagemId: tripIdNum }); else await api.post('/api/passageiroviagem', { ...dto, viagemId: tripIdNum }); setIsPassengerModalOpen(false); setSelectedPassenger(null); await fetchFilteredData(); } catch (e) { console.error(e); } };
    const handleSavePackage = async (dto: PackageSaveDto) => { if (!tripIdNum) return; try { if (selectedPackage) await api.put(`/api/encomenda/${selectedPackage.id}`, { ...dto, viagemId: tripIdNum }); else await api.post('/api/encomenda', { ...dto, viagemId: tripIdNum }); setIsPackageModalOpen(false); setSelectedPackage(null); await fetchFilteredData(); } catch (e) { console.error(e); } };
    const handleDeleteConfirm = async () => { if (!deleteItem) return; try { if (deleteItem.type === 'passenger') await api.delete(`/api/passageiroviagem/${deleteItem.item.id}`); else await api.delete(`/api/encomenda/${deleteItem.item.id}`); setDeleteItem(null); await fetchFilteredData(); } catch (e) { console.error(e); } };
    const handleMarkAsPaid = async (type: 'passenger' | 'package', id: number) => { const url = type === 'passenger' ? `/api/passageiroviagem/${id}/marcar-pago` : `/api/encomenda/${id}/marcar-pago`; try { await api.patch(url); await fetchFilteredData(); } catch (e) { console.error(e); } };
    
    // ... Utils Filtros e CSV ...
    const uniqueTaxistas = useMemo(() => { const list = Array.from(new Set(passengers.map(p => p.taxistaColeta?.pessoa?.nome).concat(passengers.map(p => p.taxistaEntrega?.pessoa?.nome)).concat(packages.flatMap(p => [p.taxistaColeta?.pessoa?.nome, p.taxistaEntrega?.pessoa?.nome])).filter(Boolean))).sort(); return list.map(t => ({ value: t as string, label: t as string })); }, [passengers, packages]);
    const uniqueComisseiros = useMemo(() => { const list = Array.from(new Set(passengers.map(p => p.comisseiro?.pessoa?.nome).concat(packages.map(p => p.comisseiro?.pessoa?.nome)).filter(Boolean))).sort(); return list.map(c => ({ value: c as string, label: c as string })); }, [passengers, packages]);
    const uniqueOnibusOptions = useMemo(() => { const ids = Array.from(new Set(passengers.map(p => p.onibusId).filter(Boolean))); return ids.map((id: any) => { const bus = busMap.get(id); return { value: String(id), label: bus ? bus.placa : `ID ${id}` }; }); }, [passengers, busMap]);
    const uniqueCidades = useMemo(() => { const cidades = new Set<string>(); passengers.forEach(p => { if (p.enderecoColeta?.cidade) cidades.add(p.enderecoColeta.cidade); if (p.enderecoEntrega?.cidade) cidades.add(p.enderecoEntrega.cidade); }); packages.forEach(p => { if (p.enderecoColeta?.cidade) cidades.add(p.enderecoColeta.cidade); if (p.enderecoEntrega?.cidade) cidades.add(p.enderecoEntrega.cidade); }); const list = Array.from(cidades).sort(); return list.map(c => ({ value: c, label: c })); }, [passengers, packages]);
    const filteredPackages = useMemo(() => { return packages.filter((pkg) => { const searchLower = packageSearchTerm.toLowerCase(); return (!searchLower || (pkg.descricao && pkg.descricao.toLowerCase().includes(searchLower)) || (pkg.remetente?.nome && pkg.remetente.nome.toLowerCase().includes(searchLower)) || (pkg.destinatario?.nome && pkg.destinatario.nome.toLowerCase().includes(searchLower))) && (filterTaxista === "todos" || pkg.taxistaColeta?.pessoa?.nome === filterTaxista || pkg.taxistaEntrega?.pessoa?.nome === filterTaxista) && (filterComisseiro === "todos" || pkg.comisseiro?.pessoa?.nome === filterComisseiro) && (filterCidade === "todos" || pkg.enderecoColeta?.cidade === filterCidade || pkg.enderecoEntrega?.cidade === filterCidade); }); }, [packages, packageSearchTerm, filterTaxista, filterComisseiro, filterCidade]);
    const isFiltering = filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterOnibus !== 'todos' || filterCidade !== 'todos' || passengerSearchTerm !== '';
    const resetFilters = () => { setFilterTaxista("todos"); setFilterComisseiro("todos"); setFilterOnibus("todos"); setFilterCidade("todos"); setPassengerSearchTerm(""); setPackageSearchTerm(""); };
    const passengerTabLabel = displayedPassengers.length === passengers.length ? `Passageiros (${passengers.length})` : `Passageiros (${displayedPassengers.length}/${passengers.length})`;
    const packageTabLabel = filteredPackages.length === packages.length ? `Encomendas (${packages.length})` : `Encomendas (${filteredPackages.length}/${packages.length})`;
    const currentBus = trip?.onibus ? trip.onibus.find(b => b.id === currentBusId) : null; 

    const csvData = [
        ["Nome", "Telefone", "CPF", "Coleta", "Entrega", "Valor", "Status"],
        ...passengers.map(p => [
            p.pessoa.nome, 
            p.pessoa.telefone || '', 
            p.pessoa.cpf || '', 
            p.enderecoColeta?.cidade || '', 
            p.enderecoEntrega?.cidade || '',
            p.valor || 0,
            p.pago ? 'Pago' : 'Pendente'
        ])
    ];

    if (loading && !trip) return <div className="p-8 text-center">Carregando...</div>;
    if (!trip && !loading) return <div className="p-8 text-center">Viagem não encontrada.</div>;

    return (
        <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/trips')} className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
                    <div><h2 className="text-lg md:text-2xl font-bold tracking-tight">Detalhes da viagem</h2><p className="text-xs md:text-sm text-muted-foreground">Gerenciamento de passageiros</p></div>
                </div>
                {/* Scroll Horizontal para Mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${tripId}/passar-lista`)} className="whitespace-nowrap"><ListIcon className="w-4 h-4 mr-2" /> Passar Lista</Button>
                    <Button variant="outline" size="sm" onClick={() => setIsMapOpen(!isMapOpen)} className="hidden xl:flex gap-2 whitespace-nowrap">{isMapOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}{isMapOpen ? 'Ocultar Mapa' : 'Mostrar Mapa'}</Button>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                            let url = `/trips/${tripId}/print`;
                            if (organizeMode === 'cidade') {
                                url += `?mode=cidade&groupBy=${cityGroupBy}`;
                            } else if (organizeMode === 'taxista') {
                                url += `?mode=taxista`;
                            } else if (organizeMode === 'comisseiro') {
                                url += `?mode=comisseiro`;
                            }
                            navigate(url);
                        }} 
                        className="whitespace-nowrap"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <CSVLink data={csvData} filename={`viagem-${tripId}.csv`} className="hidden md:block">
                        <Button variant="outline"><FileDown className="w-4 h-4 mr-2" /> Exportar</Button>
                    </CSVLink>
                </div>
            </div>

            {/* INFO CARD */}
            <Card className="border-none shadow-sm bg-slate-50">
                <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col xl:flex-row justify-between gap-4 text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 xl:flex-1">
                            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /><div className="flex flex-col"><span className="text-[10px] font-semibold text-foreground uppercase">Partida</span><span>{trip && new Date(trip.dataHoraPartida).toLocaleDateString()} {trip && new Date(trip.dataHoraPartida).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div></div>
                            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><div className="flex flex-col"><span className="text-[10px] font-semibold text-foreground uppercase">Chegada</span><span>{trip && new Date(trip.dataHoraChegada).toLocaleDateString()} {trip && new Date(trip.dataHoraChegada).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div></div>
                             <div className="flex items-center gap-2 text-muted-foreground col-span-2 md:col-span-1"><BusIcon className="w-4 h-4" /><div className="flex flex-col"><span className="text-[10px] font-semibold text-foreground uppercase">Frota</span><span>{currentBus?.placa || 'N/A'}</span></div></div>
                        </div>
                        <div className="flex gap-4 pt-2 border-t xl:border-t-0 xl:border-l xl:pl-4 border-slate-200">
                             <div className="flex items-center gap-2"><div className="p-1.5 bg-blue-100 rounded text-blue-600"><Users className="w-4 h-4" /></div><div><span className="text-xs font-medium text-muted-foreground block md:hidden">Pax</span><span className="text-xs font-medium text-muted-foreground hidden md:block">Passageiros</span><span className="text-lg font-bold leading-none">{passengers.length}</span></div></div>
                             <div className="flex items-center gap-2"><div className="p-1.5 bg-orange-100 rounded text-orange-600"><Package className="w-4 h-4" /></div><div><span className="text-xs font-medium text-muted-foreground block md:hidden">Enc</span><span className="text-xs font-medium text-muted-foreground hidden md:block">Encomendas</span><span className="text-lg font-bold leading-none">{packages.length}</span></div></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* MOBILE TOGGLE */}
            <div className="md:hidden w-full bg-slate-100 p-1 rounded-lg grid grid-cols-2 gap-1 mb-2">
                <button onClick={() => setMobileView('list')} className={cn("py-2 text-sm font-medium rounded-md transition-all", mobileView === 'list' ? "bg-white shadow text-primary" : "text-slate-500")}><div className="flex items-center justify-center gap-2"><ListIcon className="w-4 h-4"/> Lista</div></button>
                <button onClick={() => setMobileView('map')} className={cn("py-2 text-sm font-medium rounded-md transition-all", mobileView === 'map' ? "bg-white shadow text-primary" : "text-slate-500")}><div className="flex items-center justify-center gap-2"><MapIcon className="w-4 h-4"/> Mapa</div></button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className={cn("transition-all duration-500 ease-in-out", isMapOpen ? "xl:col-span-9" : "xl:col-span-12", mobileView === 'map' ? "hidden xl:block" : "block")}>
                    <Tabs defaultValue="passengers" className="space-y-4">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="passengers">{passengerTabLabel}</TabsTrigger>
                            <TabsTrigger value="packages">{packageTabLabel}</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="passengers" className="space-y-4">
                            {/* MODOS E AÇÕES - OTIMIZADO MOBILE */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-slate-50 border rounded-md overflow-x-auto">
                                {/* Container de botões com scroll horizontal */}
                                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                                    <span className="text-xs font-bold uppercase text-slate-500 whitespace-nowrap">Exibir por:</span>
                                    <Button variant={organizeMode === 'padrao' ? 'default' : 'ghost'} size="sm" onClick={() => handleModeChange('padrao')} className={cn("h-7 text-xs border border-slate-200 bg-white whitespace-nowrap", organizeMode === 'padrao' && "bg-slate-800 text-white hover:bg-slate-700 hover:text-white")}><ListIcon className="w-3 h-3 mr-1"/> Padrão</Button>
                                    
                                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 whitespace-nowrap">
                                        <Button variant={organizeMode === 'cidade' ? 'default' : 'ghost'} size="sm" onClick={() => handleModeChange('cidade')} className={cn("h-7 text-xs", organizeMode === 'cidade' && "bg-blue-600 hover:bg-blue-700")}>
                                            <MapIcon className="w-3 h-3 mr-1"/> Cidade
                                        </Button>
                                        
                                        {organizeMode === 'cidade' && (
                                            <div className="flex items-center bg-slate-100 rounded ml-1 p-0.5">
                                                <Button size="icon" variant={cityGroupBy === 'coleta' ? 'secondary' : 'ghost'} onClick={() => setCityGroupBy('coleta')} className="h-6 w-auto px-2 text-[10px] shadow-sm" title="Agrupar por Coleta">
                                                    Coleta
                                                </Button>
                                                <Button size="icon" variant={cityGroupBy === 'entrega' ? 'secondary' : 'ghost'} onClick={() => setCityGroupBy('entrega')} className="h-6 w-auto px-2 text-[10px] shadow-sm" title="Agrupar por Entrega">
                                                    Entrega
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Button variant={organizeMode === 'taxista' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('taxista')} className={cn("h-7 text-xs whitespace-nowrap", organizeMode === 'taxista' && "bg-orange-600 hover:bg-orange-700")}><Car className="w-3 h-3 mr-1"/> Taxista</Button>
                                    <Button variant={organizeMode === 'comisseiro' ? 'default' : 'outline'} size="sm" onClick={() => handleModeChange('comisseiro')} className={cn("h-7 text-xs whitespace-nowrap", organizeMode === 'comisseiro' && "bg-purple-600 hover:bg-purple-700")}><UserCheck className="w-3 h-3 mr-1"/> Comisseiro</Button>
                                </div>
                                
                                {organizeMode === 'cidade' && (
                                    <div className="flex gap-2 ml-auto w-full sm:w-auto">
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={handleSyncToDefault} 
                                            disabled={isSavingOrder} 
                                            className="h-7 text-xs shadow-sm w-full sm:w-auto text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 whitespace-nowrap"
                                            title="Aplica a ordem visual desta tela para a listagem padrão"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1" /> Sincronizar Padrão
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* FILTROS E AÇÕES PRINCIPAIS - OTIMIZADO (SEM SCROLL HORIZONTAL) */}
                            <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm space-y-3 max-w-[100vw] overflow-hidden">
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Input 
                                            placeholder="Pesquisar nome..." 
                                            value={passengerSearchTerm} 
                                            onChange={(e) => setPassengerSearchTerm(e.target.value)} 
                                        />
                                    </div>
                                    
                                    {/* CORREÇÃO: flex-wrap permite que os botões caiam para a linha de baixo se faltar espaço */}
                                    <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-start">
                                        {isFiltering && (
                                            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-500 h-9 px-2">
                                                <X className="w-4 h-4 md:mr-1" /> <span className="hidden md:inline">Limpar</span>
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            onClick={() => { setSelectedPassenger(null); setIsPassengerModalOpen(true); }} 
                                            className="bg-primary hover:bg-primary/90 gap-2 flex-1 sm:flex-none min-w-[100px]"
                                        >
                                            <Plus className="w-4 h-4" /> Novo
                                        </Button>
                                        
                                        <Button 
                                            onClick={() => { setEditingGroup(null); setIsFamilyModalOpen(true); }} 
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2 flex-1 sm:flex-none min-w-[100px]"
                                        >
                                            <Users className="w-4 h-4" /> Grupo
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <FilterCombobox options={uniqueTaxistas} value={filterTaxista} onChange={setFilterTaxista} placeholder="Taxista" />
                                    <FilterCombobox options={uniqueComisseiros} value={filterComisseiro} onChange={setFilterComisseiro} placeholder="Comisseiro" />
                                    <FilterCombobox options={uniqueOnibusOptions} value={filterOnibus} onChange={setFilterOnibus} placeholder="Ônibus" />
                                    <FilterCombobox options={uniqueCidades} value={filterCidade} onChange={setFilterCidade} placeholder="Cidade" />
                                </div>
                            </div>
                            
                            {/* LISTA UNIFICADA */}
                            <div className="mt-4">
                                <PassengerOrganizer 
                                    data={hierarchicalData} 
                                    onChange={handleHierarchicalChange} 
                                    onMarkAsPaid={(id) => handleMarkAsPaid('passenger', id)}
                                    onEdit={(p) => { setSelectedPassenger(p.dadosCompletos || p); setIsPassengerModalOpen(true); }}
                                    onOpenLuggage={(p) => { setSelectedPassenger(p.dadosCompletos || p); setIsLuggageModalOpen(true); }}
                                    onDelete={(p) => setDeleteItem({ type: 'passenger', item: p })}
                                    onColorChange={handleColorChange}
                                    onLink={handleLinkPassengers}
                                    onUnlink={handleUnlinkPassenger}
                                    onEditGroup={(group) => {
                                        setEditingGroup(group); 
                                        setIsFamilyModalOpen(true);
                                    }}
                                />
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="packages" className="space-y-4">
                             <div className="bg-white p-3 md:p-4 rounded-lg border shadow-sm space-y-3">
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <div className="relative flex-1"><Input placeholder="Pesquisar encomendas..." value={packageSearchTerm} onChange={(e) => setPackageSearchTerm(e.target.value)} /></div>
                                    <div className="flex items-center gap-2 justify-between lg:justify-start">
                                        {(filterTaxista !== 'todos' || filterComisseiro !== 'todos' || filterCidade !== 'todos' || packageSearchTerm !== '') && (<Button variant="ghost" size="sm" onClick={resetFilters} className="text-red-500 h-9"><X className="w-4 h-4 mr-1" /> Limpar</Button>)}
                                        <Button onClick={() => { setSelectedPackage(null); setIsPackageModalOpen(true); }} className="bg-primary hover:bg-primary/90 gap-2 w-full lg:w-auto"><Plus className="w-4 h-4" /> Nova</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <FilterCombobox options={uniqueTaxistas} value={filterTaxista} onChange={setFilterTaxista} placeholder="Taxista" />
                                    <FilterCombobox options={uniqueComisseiros} value={filterComisseiro} onChange={setFilterComisseiro} placeholder="Comisseiro" />
                                    <FilterCombobox options={uniqueCidades} value={filterCidade} onChange={setFilterCidade} placeholder="Cidade" />
                                </div>
                            </div>
                            <PackageTable packages={filteredPackages} loading={loading} onMarkAsPaid={(id) => handleMarkAsPaid('package', id)} onEdit={(p) => { setSelectedPackage(p); setIsPackageModalOpen(true); }} onDelete={(p) => setDeleteItem({ type: 'package', item: p })} onRefreshData={fetchFilteredData} />
                        </TabsContent>
                    </Tabs>
                </div>
                
                {/* ... MAPA LATERAL ... */}
                <div className={cn("xl:col-span-3 transition-all duration-500", mobileView === 'map' ? "block" : "hidden", isMapOpen ? "xl:block" : "xl:hidden")}>
                    <div className="sticky top-6 space-y-4">
                        {trip?.onibus && trip.onibus.length > 1 ? (
                            <Tabs defaultValue={currentBusId?.toString()} onValueChange={(val) => setCurrentBusId(parseInt(val))} className="w-full">
                                <TabsList className="w-full mb-2 grid grid-cols-2">{trip.onibus.map(bus => (<TabsTrigger key={bus.id} value={bus.id.toString()} className="text-xs px-1 truncate">{bus.placa}</TabsTrigger>))}</TabsList>
                                {trip.onibus.map(bus => (<TabsContent key={bus.id} value={bus.id.toString()} className="mt-0"><SeatMap tripId={tripIdNum} busId={bus.id} layoutJson={bus.layoutJson} capacity={bus.capacidadePassageiros} onSelectSeat={handleSelectSeat} passengers={passengers.filter(p => p.onibusId === bus.id)} /></TabsContent>))}
                            </Tabs>
                        ) : (
                            <SeatMap tripId={tripIdNum} busId={currentBusId || 0} layoutJson={currentBus?.layoutJson} capacity={currentBus?.capacidadePassageiros || 0} onSelectSeat={handleSelectSeat} passengers={passengers.filter(p => p.onibusId === (currentBusId || 0))} />
                        )}
                    </div>
                </div>
            </div>

            {/* ... MODAIS ... */}
            <PassengerModal isOpen={isPassengerModalOpen} onClose={() => { setIsPassengerModalOpen(false); setSelectedPassenger(null); }} onSave={handleSavePassenger} passenger={selectedPassenger} />
            <PackageModal isOpen={isPackageModalOpen} onClose={() => { setIsPackageModalOpen(false); setSelectedPackage(null); }} onSave={handleSavePackage} package={selectedPackage} />
            <LuggageModal isOpen={isLuggageModalOpen} onClose={() => { setIsLuggageModalOpen(false); setSelectedPassenger(null); fetchFilteredData(); }} passenger={selectedPassenger} />
            <SeatBinderModal isOpen={isSeatBinderModalOpen} onClose={() => { setIsSeatBinderModalOpen(false); setSeatTargetId(null); }} onBind={handleBindPassenger} availablePassengers={availablePassengers} seatId={seatTargetId} seatNumber={seatTargetNumber} />
            <DeleteConfirmModal isOpen={!!passengerToDesassociate} onClose={() => { setPassengerToDesassociate(null); }} onConfirm={handleDesassociateConfirm} title="Desvincular Assento" description={`Tem certeza de que deseja desvincular o assento?`} />
            <DeleteConfirmModal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDeleteConfirm} title="Excluir Item" description="Tem certeza?" />
            <DeleteConfirmModal isOpen={!!passengerToUnlink} onClose={() => setPassengerToUnlink(null)} onConfirm={confirmUnlinkGroup} title="Desvincular do Grupo" description={`Tem certeza que deseja desvincular ${passengerToUnlink?.pessoa.nome} do grupo?`} confirmLabel="Desvincular" />
            
            <FamilyPassengerModal 
                isOpen={isFamilyModalOpen} 
                onClose={() => {
                    setIsFamilyModalOpen(false);
                    setEditingGroup(null);
                }} 
                onSaveSuccess={() => { fetchFilteredData(); setIsFamilyModalOpen(false); }} 
                tripId={tripId!} 
                initialData={editingGroup} 
            />
        </div>
    );
}