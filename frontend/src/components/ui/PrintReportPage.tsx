import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import api from '../services/api';
import PassengerTable from './PassengerTable';
import PackageTable from './PackageTable';
import { Skeleton } from './ui/skeleton';
import logo from '../assets/logo.png';

// Re-definindo as interfaces necessárias para esta página
interface Bus { idOnibus: number; modelo: string; placa: string; }
interface Trip { id: number; dataHoraPartida: string; dataHoraChegada: string; onibus: Bus; }
interface PassengerData { [key: string]: any; } // Usando 'any' para simplificar, já que a tabela lida com isso
interface PackageData { [key: string]: any; }

export default function PrintReportPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  // Efeito para buscar os dados
  useEffect(() => {
    const fetchAllData = async () => {
      if (!tripId) { setLoading(false); return; }
      setLoading(true);
      try {
        const [tripRes, passengersRes, packagesRes] = await Promise.all([
          api.get(`/viagem/${tripId}`),
          api.get(`/api/v1/reports/passageiros/viagem/${tripId}`),
          api.get(`/api/v1/reports/encomendas/viagem/${tripId}`)
        ]);
        
        setTrip(tripRes.data);
        
        // Adiciona contagem de bagagem (lógica do TripDetailsPage)
        const passengersData: PassengerData[] = passengersRes.data;
        const passengersWithLuggage = await Promise.all(
          passengersData.map(async (passenger) => {
            const luggageResponse = await api.get(`/bagagem/passageiro/${passenger.id}`);
            return { ...passenger, luggageCount: luggageResponse.data.length };
          })
        );
        setPassengers(passengersWithLuggage);
        setPackages(packagesRes.data);

      } catch (error) { console.error('Erro ao buscar dados para impressão:', error); }
      finally { setLoading(false); }
    };
    fetchAllData();
  }, [tripId]);

  // Efeito para disparar a impressão
  useEffect(() => {
    if (loading === false && trip) {
      // Espera um pequeno instante para garantir que tudo renderizou
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, trip]);

  // Efeito para voltar à página anterior após imprimir
  useEffect(() => {
    const handleAfterPrint = () => {
      navigate(-1); // Volta para a página de detalhes
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="p-10 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!trip) {
    return <div className="p-10">Viagem não encontrada.</div>;
  }

  return (
    <div className="p-10 space-y-6">
      {/* Cabeçalho da Impressão */}
      <div className="flex justify-between items-center mb-6">
        <img src={logo} alt="Patricio Turismo" className="h-12 w-auto" />
        <div className="text-right">
          <h1 className="text-2xl font-bold">Relatório de Viagem</h1>
          <p className="text-muted-foreground">Bahia ↔ São Paulo</p>
        </div>
      </div>
      
      {/* Card de Informações da Viagem */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de viagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div><p className="text-sm text-muted-foreground">Data</p><p>{new Date(trip.dataHoraPartida).toLocaleDateString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Partida</p><p>{new Date(trip.dataHoraPartida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-sm text-muted-foreground">Chegada</p><p>{new Date(trip.dataHoraChegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-sm text-muted-foreground">Ônibus</p><p>{trip.onibus.placa}</p></div>
            <div><p className="text-sm text-muted-foreground">Modelo</p><p>{trip.onibus.modelo}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Passageiros */}
      <h3 className="text-xl font-semibold pt-4">Relatório de Passageiros</h3>
      <PassengerTable passengers={passengers} loading={loading} isPrintView={true} />
      
      {/* Tabela de Encomendas */}
      <h3 className="text-xl font-semibold pt-4">Relatório de Encomendas</h3>
      <PackageTable packages={packages} loading={loading} isPrintView={true} />
    </div>
  );
}