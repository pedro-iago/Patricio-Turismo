import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Estilos Gerais
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 60, 
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#F97316',
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
    paddingLeft: 6,
  },
  // Tabela
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    minHeight: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 5,
    justifyContent: 'center',
  },
  
  // Barra de Cor (Fina)
  colorIndicatorHeader: {
    width: '1%',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  colorIndicator: {
    width: '1%',
  },

  // Larguras das Colunas
  colIndex: { width: '6%' },
  colName: { width: '25%' },
  colDoc: { width: '15%' },
  colRoute: { width: '23%' },
  colAgent: { width: '15%' },
  colSeat: { width: '7%' },
  colValue: { width: '8%' }, // Agora é a última

  // Estilos de Texto
  textHeader: { fontWeight: 'bold', fontSize: 8 },
  textCell: { fontSize: 8 },
  textSmall: { fontSize: 7, color: '#6B7280', marginBottom: 1 },
  
  textAddress: { fontSize: 7, color: '#374151', marginBottom: 2, lineHeight: 1.2 },
  textPhone: { fontSize: 9, fontWeight: 'bold', color: '#000000', marginBottom: 1 },
  textDoc: { fontSize: 7, color: '#6B7280' },

  footer: {
    position: 'absolute', 
    bottom: 20,
    left: 30, 
    right: 30, 
    textAlign: 'center',
    color: 'grey', 
    fontSize: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute', fontSize: 8, bottom: 20, left: 0, right: 0, textAlign: 'center', color: 'grey',
  },
});

const formatCurrency = (value: number) => 
  value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';

const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

const formatFullAddress = (addr: any) => {
    if (!addr) return 'Não informado';
    const parts = [];
    if (addr.logradouro) parts.push(addr.logradouro);
    if (addr.numero) parts.push(addr.numero);
    if (addr.bairro) parts.push(addr.bairro);
    if (addr.cidade) parts.push(addr.cidade);
    return parts.join(', ');
};

interface TripReportPDFProps {
  trip: any;
  passengers: any[];
  packages: any[];
}

export const TripReportPDF = ({ trip, passengers, packages }: TripReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      
      {/* CABEÇALHO */}
      <View style={styles.header} fixed>
        <View>
          <Text style={styles.headerTitle}>Relatório de Viagem</Text>
          <Text style={styles.headerSub}>Patrício Turismo</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.textSmall}>Viagem #{trip.id}</Text>
            <Text style={styles.textSmall}>Partida: {formatDate(trip.dataHoraPartida)}</Text>
            <Text style={styles.textSmall}>Chegada: {formatDate(trip.dataHoraChegada)}</Text>
        </View>
      </View>

      {/* --- TABELA DE PASSAGEIROS --- */}
      <Text style={styles.sectionTitle}>Lista de Passageiros ({passengers.length})</Text>

      <View style={styles.table}>
        {/* Header */}
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

        {/* Rows */}
        {passengers.map((p, i) => {
          const currentBus = trip.onibus?.find((b: any) => b.id === p.onibusId);
          const rowColor = p.corTag || 'transparent';
          
          const prevP = passengers[i - 1];
          const nextP = passengers[i + 1];
          const isGrouped = p.grupoId && ((prevP && prevP.grupoId === p.grupoId) || (nextP && nextP.grupoId === p.grupoId));
          const isFirstInGroup = isGrouped && (!prevP || prevP.grupoId !== p.grupoId);
          const isLastInGroup = isGrouped && (!nextP || nextP.grupoId !== p.grupoId);

          const rowStyles = [styles.tableRow];
          if (isGrouped) {
              rowStyles.push({ backgroundColor: '#fff7ed' });
              if (isFirstInGroup) rowStyles.push({ borderTopWidth: 2, borderTopColor: '#ffedd5' });
              if (isLastInGroup) rowStyles.push({ borderBottomWidth: 2, borderBottomColor: '#ffedd5' });
              else rowStyles.push({ borderBottomWidth: 0 });
          }

          const telefoneDisplay = p.pessoa.telefone || (p.pessoa.telefones && p.pessoa.telefones.length > 0 ? p.pessoa.telefones[0] : '-');

          return (
            <View key={p.id} style={rowStyles} wrap={false}>
              
              <View style={[styles.colorIndicator, { backgroundColor: rowColor }]} />

              <View style={[styles.tableCol, styles.colIndex]}>
                <Text style={styles.textCell}>{i + 1}</Text>
              </View>
              
              <View style={[styles.tableCol, styles.colName]}>
                <Text style={[styles.textCell, { fontWeight: 'bold' }]}>{p.pessoa.nome}</Text>
                {p.bagagens && p.bagagens.length > 0 && (
                   <Text style={styles.textSmall}>Bagagem: {p.bagagens.length} vols ({p.bagagens.map((b:any) => b.descricao).join(', ')})</Text>
                )}
              </View>

              <View style={[styles.tableCol, styles.colDoc]}>
                <Text style={styles.textPhone}>{telefoneDisplay}</Text>
                <Text style={styles.textDoc}>{p.pessoa.cpf || 'S/ Doc'}</Text>
              </View>

              <View style={[styles.tableCol, styles.colRoute]}>
                <View style={{marginBottom: 4}}>
                    <Text style={[styles.textSmall, {fontWeight: 'bold'}]}>C:</Text>
                    <Text style={styles.textAddress}>{formatFullAddress(p.enderecoColeta)}</Text>
                </View>
                <View>
                    <Text style={[styles.textSmall, {fontWeight: 'bold'}]}>E:</Text>
                    <Text style={styles.textAddress}>{formatFullAddress(p.enderecoEntrega)}</Text>
                </View>
              </View>

              <View style={[styles.tableCol, styles.colAgent]}>
                <Text style={styles.textSmall}>TC: {p.taxistaColeta?.pessoa?.nome || '-'}</Text>
                <Text style={styles.textSmall}>TE: {p.taxistaEntrega?.pessoa?.nome || '-'}</Text>
                <Text style={styles.textSmall}>C: {p.comisseiro?.pessoa?.nome || '-'}</Text>
              </View>

              <View style={[styles.tableCol, styles.colSeat]}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>{p.numeroAssento || '-'}</Text>
                {currentBus && (
                    <Text style={{ fontSize: 6, color: '#6B7280', textAlign: 'center', marginTop: 2 }}>{currentBus.placa}</Text>
                )}
              </View>

              {/* VALOR AGORA NO FINAL */}
              <View style={[styles.tableCol, styles.colValue]}>
                <Text style={styles.textCell}>{formatCurrency(p.valor)}</Text>
                <Text style={[styles.textSmall, { color: p.pago ? 'green' : 'red' }]}>{p.pago ? 'Pago' : 'Pend.'}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* --- TABELA DE ENCOMENDAS --- */}
      {packages.length > 0 && (
          <>
            <Text style={styles.sectionTitle} break>Lista de Encomendas ({packages.length})</Text>
            <View style={styles.table}>
                <View style={styles.tableRow} fixed>
                    <View style={[styles.tableColHeader, {width: '35%'}]}><Text style={styles.textHeader}>Descrição / Remetente / Destinatário</Text></View>
                    <View style={[styles.tableColHeader, {width: '25%'}]}><Text style={styles.textHeader}>Endereço de Entrega</Text></View>
                    <View style={[styles.tableColHeader, {width: '25%'}]}><Text style={styles.textHeader}>Afiliados</Text></View>
                    <View style={[styles.tableColHeader, {width: '15%'}]}><Text style={styles.textHeader}>Valor</Text></View>
                </View>
                {packages.map((pkg) => (
                    <View key={pkg.id} style={styles.tableRow} wrap={false}>
                        <View style={[styles.tableCol, {width: '35%'}]}>
                            <Text style={[styles.textCell, {fontWeight: 'bold', marginBottom: 4}]}>{pkg.descricao}</Text>
                            <Text style={styles.textSmall}><Text style={{fontWeight: 'bold'}}>De:</Text> {pkg.remetente?.nome} {pkg.remetente?.telefone ? `(${pkg.remetente.telefone})` : ''}</Text>
                            <Text style={[styles.textSmall, {marginTop: 2}]}><Text style={{fontWeight: 'bold'}}>Para:</Text> {pkg.destinatario?.nome} {pkg.destinatario?.telefone ? `(${pkg.destinatario.telefone})` : ''}</Text>
                        </View>
                        <View style={[styles.tableCol, {width: '25%'}]}>
                             <Text style={styles.textAddress}>{formatFullAddress(pkg.enderecoEntrega)}</Text>
                        </View>
                        <View style={[styles.tableCol, {width: '25%'}]}>
                            <Text style={styles.textSmall}>TC: {pkg.taxistaColeta?.pessoa?.nome || '-'}</Text>
                            <Text style={styles.textSmall}>TE: {pkg.taxistaEntrega?.pessoa?.nome || '-'}</Text>
                            <Text style={styles.textSmall}>C: {pkg.comisseiro?.pessoa?.nome || '-'}</Text>
                        </View>
                         <View style={[styles.tableCol, {width: '15%'}]}>
                             <Text style={styles.textCell}>{formatCurrency(pkg.valor)}</Text>
                             <Text style={[styles.textSmall, { color: pkg.pago ? 'green' : 'red' }]}>{pkg.pago ? 'Pago' : 'Pend.'}</Text>
                        </View>
                    </View>
                ))}
            </View>
          </>
      )}

      {/* RODAPÉ */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`${pageNumber} / ${totalPages}`)} fixed />
      <View style={styles.footer} fixed>
        <Text>Gerado pelo Sistema Patrício Turismo - {new Date().toLocaleDateString()}</Text>
      </View>

    </Page>
  </Document>
);