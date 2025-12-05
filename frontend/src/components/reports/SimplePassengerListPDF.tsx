import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Estilos minimalistas para a Lista Simples
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#FFFFFF',
  },
  // Cabeçalho Principal
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#000000',
  },
  headerSub: {
    fontSize: 10,
    color: '#4b5563', // gray-600
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
  },
  tripInfoText: {
    fontSize: 8,
    color: '#6b7280', // gray-500
  },
  
  // Tabela
  tableContainer: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 4,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  
  // Linhas
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // gray-200
    paddingVertical: 6,
    alignItems: 'center',
  },
  
  // Colunas
  colIndex: { width: '8%', color: '#6b7280' },
  colName: { width: '50%', fontWeight: 'bold', textTransform: 'uppercase' },
  colDoc: { width: '30%', fontFamily: 'Helvetica' }, // Helvetica tem numeros monospaced por padrao
  colSeat: { width: '12%', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  
  // Rodapé
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    color: '#9ca3af', // gray-400
    fontSize: 8,
  },
});

interface SimpleListProps {
  trip: any;
  passengers: any[];
  busInfo: string;
}

export const SimplePassengerListPDF = ({ trip, passengers, busInfo }: SimpleListProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* CABEÇALHO */}
      <View style={styles.headerContainer} fixed>
        <View>
          <Text style={styles.headerTitle}>Lista de Passageiros</Text>
          <Text style={styles.headerSub}>
            {new Date(trip.dataHoraPartida).toLocaleDateString()} - {busInfo}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.tripInfoText}>Viagem #{trip.id}</Text>
          <Text style={styles.tripInfoText}>{passengers.length} Passageiros</Text>
        </View>
      </View>

      {/* TABELA - Cabeçalho */}
      <View style={styles.tableHeader} fixed>
        <Text style={[styles.headerText, styles.colIndex]}>#</Text>
        <Text style={[styles.headerText, styles.colName]}>Nome Completo</Text>
        <Text style={[styles.headerText, styles.colDoc]}>Documento (CPF)</Text>
        <Text style={[styles.headerText, styles.colSeat]}>Assento</Text>
      </View>

      {/* TABELA - Linhas */}
      {passengers.map((p, i) => (
        <View key={p.id} style={styles.row} wrap={false}>
          <Text style={styles.colIndex}>{i + 1}</Text>
          <Text style={styles.colName}>{p.pessoa.nome}</Text>
          <Text style={styles.colDoc}>{p.pessoa.cpf || '-'}</Text>
          <Text style={styles.colSeat}>{p.numeroAssento || '-'}</Text>
        </View>
      ))}

      {/* RODAPÉ */}
      <View style={styles.footer} fixed>
        <Text>Patrício Turismo - Lista Simplificada</Text>
        <Text render={({ pageNumber, totalPages }) => (`Página ${pageNumber} de ${totalPages}`)} />
      </View>

    </Page>
  </Document>
);