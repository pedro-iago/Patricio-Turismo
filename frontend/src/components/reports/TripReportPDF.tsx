import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', paddingTop: 15, paddingLeft: 30, paddingRight: 30, paddingBottom: 15, fontSize: 10, fontFamily: 'Helvetica' },
  
  header: { marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#CCCCCC', paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  headerSub: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 8, marginBottom: 4, color: '#F97316', borderLeftWidth: 3, borderLeftColor: '#F97316', paddingLeft: 6 },
  
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, borderColor: '#e5e7eb' },
  tableRow: { flexDirection: 'row', minHeight: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', backgroundColor: '#f3f4f6', padding: 3 },
  tableCol: { borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#e5e7eb', padding: 3, justifyContent: 'center' },
  
  // Headers de Agrupamento
  groupHeaderRow: { flexDirection: 'row', backgroundColor: '#f97316', paddingVertical: 1.5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#ea580c', alignItems: 'center' },
  groupHeaderText: { fontSize: 8, fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase' },
  subGroupHeaderRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 1, paddingLeft: 20, borderBottomWidth: 1, borderBottomColor: '#d1d5db', alignItems: 'center' },
  subGroupHeaderText: { fontSize: 7, fontWeight: 'bold', color: '#374151', textTransform: 'uppercase' },

  // Marcadores Visuais
  colorIndicatorHeader: { width: 3, backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderColor: '#e5e7eb' }, 
  colorIndicator: { width: 3 },

  // Colunas
  colIndex: { width: '5%' }, 
  colName: { width: '30%' }, 
  colDoc: { width: '13%' }, 
  colRoute: { width: '24%' }, 
  colAgent: { width: '12%' }, 
  colSeat: { width: '7%' }, 
  colValue: { width: '9%' },

  // Textos
  textHeader: { fontWeight: 'bold', fontSize: 7 }, 
  textCell: { fontSize: 7 }, 
  textLuggage: { fontSize: 6, color: '#4b5563', marginTop: 1, fontStyle: 'italic' },
  textSmall: { fontSize: 6, color: '#6B7280', marginBottom: 0.5 }, 
  textAddress: { fontSize: 6.5, color: '#374151', marginBottom: 1, lineHeight: 1.1 }, 
  textPhone: { fontSize: 8, fontWeight: 'bold', color: '#000000', marginBottom: 0.5 }, 
  textDoc: { fontSize: 6.5, color: '#6B7280' },
  
  footer: { marginTop: 10, textAlign: 'center', color: 'grey', fontSize: 7, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 4 },
  pageNumber: { position: 'absolute', fontSize: 7, bottom: 10, left: 0, right: 0, textAlign: 'center', color: 'grey' },
});

const formatCurrency = (value: number) => value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
const formatFullAddress = (addr: any) => { if (!addr) return 'Não informado'; const parts = []; if (addr.logradouro) parts.push(addr.logradouro); if (addr.numero) parts.push(addr.numero); if (addr.bairro) parts.push(addr.bairro); if (addr.cidade) parts.push(addr.cidade); return parts.join(', '); };
const sanitizeBairro = (bairro?: string) => { if (!bairro || bairro.trim() === '') return 'GERAL'; const normalized = bairro.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); if (normalized === 'geral') return 'GERAL'; return bairro.trim().toUpperCase(); };
const normalize = (str?: string) => { if (!str) return ''; return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); };

interface TripReportPDFProps { trip: any; passengers: any[]; packages: any[]; organizeMode?: 'padrao' | 'cidade' | 'taxista' | 'comisseiro'; groupingType?: 'coleta' | 'entrega'; }

export const TripReportPDF = ({ trip, passengers, packages, organizeMode = 'padrao', groupingType = 'coleta' }: TripReportPDFProps) => {
  
  const cityStats = React.useMemo(() => {
    const stats: Record<string, Set<string>> = {};
    if (organizeMode === 'cidade') {
        passengers.forEach(p => {
            const addr = groupingType === 'entrega' ? p.enderecoEntrega : p.enderecoColeta;
            const cityKey = normalize(addr?.cidade || 'SEM CIDADE');
            const bairroKey = sanitizeBairro(addr?.bairro);
            if (!stats[cityKey]) stats[cityKey] = new Set();
            stats[cityKey].add(bairroKey);
        });
    }
    return stats;
  }, [passengers, organizeMode, groupingType]);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.header}>
          <View><Text style={styles.headerTitle}>Relatório de Viagem</Text><Text style={styles.headerSub}>Patrício Turismo</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={styles.textSmall}>Viagem #{trip.id}</Text><Text style={styles.textSmall}>Partida: {formatDate(trip.dataHoraPartida)}</Text><Text style={styles.textSmall}>Chegada: {formatDate(trip.dataHoraChegada)}</Text></View>
        </View>

        <Text style={styles.sectionTitle}>
            Passageiros ({passengers.length}) 
            {organizeMode === 'cidade' ? ` - ${groupingType?.toUpperCase()}` : ''}
            {organizeMode === 'taxista' ? ` - TAXISTA` : ''}
        </Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, { borderBottomWidth: 1 }]} fixed>
            <View style={styles.colorIndicatorHeader} />
            <View style={[styles.tableColHeader, styles.colIndex]}><Text style={styles.textHeader}>#</Text></View>
            <View style={[styles.tableColHeader, styles.colName]}><Text style={styles.textHeader}>Passageiro</Text></View>
            <View style={[styles.tableColHeader, styles.colDoc]}><Text style={styles.textHeader}>Tel / Doc</Text></View>
            <View style={[styles.tableColHeader, styles.colRoute]}><Text style={styles.textHeader}>Coleta / Entrega</Text></View>
            <View style={[styles.tableColHeader, styles.colAgent]}><Text style={styles.textHeader}>Afiliados</Text></View>
            <View style={[styles.tableColHeader, styles.colSeat]}><Text style={styles.textHeader}>Assento</Text></View>
            <View style={[styles.tableColHeader, styles.colValue]}><Text style={styles.textHeader}>Valor</Text></View>
          </View>

          {passengers.map((p, i) => {
            const prevP = passengers[i - 1];
            const nextP = passengers[i + 1];

            // LÓGICA DE GRUPO FAMILIAR
            const hasGroup = !!p.grupoId;
            const isSameGroupPrev = hasGroup && prevP?.grupoId === p.grupoId;
            const isSameGroupNext = hasGroup && nextP?.grupoId === p.grupoId;
            
            // Define estilo da linha baseado no grupo
            const rowStyles: any[] = [styles.tableRow];
            if (hasGroup) {
                rowStyles.push({ backgroundColor: '#f0f9ff' }); // Azul bem claro para grupos
                // Se é o último do grupo, adiciona borda inferior
                if (!isSameGroupNext) {
                    rowStyles.push({ borderBottomWidth: 1, borderBottomColor: '#bfdbfe' });
                } else {
                    // Se não é o último, remove borda interna para parecer um bloco único
                    rowStyles.push({ borderBottomWidth: 0 });
                }
            }

            // --- Lógica de Cabeçalhos (Cidade/Taxista) ---
            let headers = null;
            if (organizeMode === 'cidade') {
                const targetAddr = groupingType === 'entrega' ? p.enderecoEntrega : p.enderecoColeta;
                const prevAddr = groupingType === 'entrega' ? prevP?.enderecoEntrega : prevP?.enderecoColeta;
                const currentCityRaw = targetAddr?.cidade || 'SEM CIDADE DEFINIDA';
                const currentCityKey = normalize(currentCityRaw);
                const currentBairro = sanitizeBairro(targetAddr?.bairro);
                const isNewCity = i === 0 || currentCityKey !== normalize(prevAddr?.cidade || '');
                const isNewBairro = i === 0 || currentBairro !== sanitizeBairro(prevAddr?.bairro);

                if (isNewCity) {
                    const bairroCount = cityStats[currentCityKey]?.size || 0;
                    if (bairroCount > 1) {
                        headers = (
                            <View wrap={false}>
                                <View style={styles.groupHeaderRow}><Text style={styles.groupHeaderText}>{currentCityRaw.toUpperCase()}</Text></View>
                                <View style={styles.subGroupHeaderRow}><Text style={styles.subGroupHeaderText}>{currentBairro}</Text></View>
                            </View>
                        );
                    } else {
                        headers = <View style={styles.groupHeaderRow} wrap={false}><Text style={styles.groupHeaderText}>{currentCityRaw.toUpperCase()} <Text style={{color: '#ffedd5', fontSize: 7}}>► {currentBairro}</Text></Text></View>;
                    }
                } else if (isNewBairro) {
                    headers = <View style={styles.subGroupHeaderRow} wrap={false}><Text style={styles.subGroupHeaderText}>{currentBairro}</Text></View>;
                }
            } else if (organizeMode === 'taxista') {
                const curr = p.taxistaColeta?.pessoa?.nome || 'SEM TAXISTA';
                if (i === 0 || normalize(curr) !== normalize(prevP?.taxistaColeta?.pessoa?.nome)) headers = <View style={styles.groupHeaderRow} wrap={false}><Text style={styles.groupHeaderText}>{curr.toUpperCase()}</Text></View>;
            } else if (organizeMode === 'comisseiro') {
                const curr = p.comisseiro?.pessoa?.nome || 'SEM COMISSEIRO';
                if (i === 0 || normalize(curr) !== normalize(prevP?.comisseiro?.pessoa?.nome)) headers = <View style={styles.groupHeaderRow} wrap={false}><Text style={styles.groupHeaderText}>{curr.toUpperCase()}</Text></View>;
            }

            return (
              <React.Fragment key={p.id}>
                  {headers}
                  <View style={rowStyles} wrap={false}>
                      {/* Indicador de Cor + Indicador de Grupo (Barra Azul Lateral) */}
                      <View style={[styles.colorIndicator, { 
                          backgroundColor: p.corTag || (hasGroup ? '#3b82f6' : 'transparent'),
                          width: hasGroup ? 4 : 3 
                      }]} />
                      
                      <View style={[styles.tableCol, styles.colIndex]}><Text style={styles.textCell}>{i + 1}</Text></View>
                      
                      <View style={[styles.tableCol, styles.colName]}>
                          <Text style={[styles.textCell, { fontWeight: 'bold' }]}>{p.pessoa.nome}</Text>
                          {p.bagagens?.length > 0 && (
                            <Text style={styles.textLuggage}>
                                {p.bagagens.map((b: any) => b.descricao).join(', ')}
                            </Text>
                          )}
                      </View>
                      
                      <View style={[styles.tableCol, styles.colDoc]}>
                          <Text style={styles.textPhone}>{p.pessoa.telefone || p.pessoa.telefones?.[0] || '-'}</Text>
                          <Text style={styles.textDoc}>{p.pessoa.cpf || 'S/ Doc'}</Text>
                      </View>

                      {/* Rota com lógica de "Idem" para grupos */}
                      <View style={[styles.tableCol, styles.colRoute]}>
                          {(!isSameGroupPrev) ? (
                              <>
                                <View style={{marginBottom: 1}}><Text style={[styles.textSmall, {fontWeight: 'bold'}]}>C:</Text><Text style={styles.textAddress}>{formatFullAddress(p.enderecoColeta)}</Text></View>
                                <View><Text style={[styles.textSmall, {fontWeight: 'bold'}]}>E:</Text><Text style={styles.textAddress}>{formatFullAddress(p.enderecoEntrega)}</Text></View>
                              </>
                          ) : (
                              <Text style={{fontSize: 14, color: '#bfdbfe', textAlign: 'center', marginTop: 4}}>"</Text>
                          )}
                      </View>

                      <View style={[styles.tableCol, styles.colAgent]}>
                          <Text style={styles.textSmall}>TC: {p.taxistaColeta?.pessoa?.nome || '-'}</Text>
                          <Text style={styles.textSmall}>TE: {p.taxistaEntrega?.pessoa?.nome || '-'}</Text>
                          <Text style={styles.textSmall}>C: {p.comisseiro?.pessoa?.nome || '-'}</Text>
                      </View>
                      <View style={[styles.tableCol, styles.colSeat]}><Text style={{ fontSize: 10, fontWeight: 'bold', textAlign: 'center' }}>{p.numeroAssento || '-'}</Text></View>
                      <View style={[styles.tableCol, styles.colValue]}><Text style={styles.textCell}>{formatCurrency(p.valor)}</Text><Text style={[styles.textSmall, { color: p.pago ? 'green' : 'red' }]}>{p.pago ? 'Pg' : 'Pd'}</Text></View>
                  </View>
              </React.Fragment>
            );
          })}
        </View>
        <View style={styles.footer}><Text>Gerado em {new Date().toLocaleDateString()}</Text></View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`${pageNumber} / ${totalPages}`)} fixed />
      </Page>
    </Document>
  );
};