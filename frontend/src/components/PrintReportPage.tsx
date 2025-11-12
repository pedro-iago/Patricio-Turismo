import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import api from '../services/api';
import PassengerTable from './PassengerTable';
import PackageTable from './PackageTable';
import { Skeleton } from './ui/skeleton';
import logo from '../assets/logo.png';

// --- Interfaces Corrigidas ---
interface Bus { 
  idOnibus: number; 
  modelo: string; 
  placa: string; 
  capacidadePassageiros: number; 
}
interface TripDto { 
  id: number; 
  dataHoraPartida: string; 
  dataHoraChegada: string; 
  onibusId: number; 
}
interface PassengerData { [key: string]: any; } 
interface PackageData { [key: string]: any; }

export default function PrintReportPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<TripDto | null>(null);
  const [bus, setBus] = useState<Bus | null>(null); // Estado para guardar o autocarro (ônibus)
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  // Efeito para buscar os dados
  useEffect(() => {
    const fetchAllData = async () => {
      if (!tripId) { setLoading(false); return; }
      setLoading(true);
      
      let fetchedTrip: TripDto | null = null;

      try {
        // 1. Busca a viagem
        // --- CAMINHO CORRIGIDO ---
        const tripRes = await api.get<TripDto>(`/api/viagem/${tripId}`);
        setTrip(tripRes.data);
        fetchedTrip = tripRes.data; // Guarda para usar já
        
        if (fetchedTrip) {
          // 2. Busca os dados em paralelo (incluindo o autocarro/ônibus)
          const [passengersRes, packagesRes, busRes] = await Promise.all([
            api.get(`/api/v1/reports/passageiros/viagem/${tripId}`),
            api.get(`/api/v1/reports/encomendas/viagem/${tripId}`),
            api.get<Bus>(`/api/onibus/${fetchedTrip.onibusId}`) // Busca o autocarro (ônibus)
          ]);
          
          setBus(busRes.data); // Guarda o autocarro (ônibus)

          // 3. Processa passageiros e bagagens
          const passengersData: PassengerData[] = passengersRes.data;
          const passengersWithLuggage = await Promise.all(
            passengersData.map(async (passenger) => {
              if (!passenger || typeof passenger.id === 'undefined') {
                return passenger;
              }
              // --- CAMINHO CORRIGIDO ---
              const luggageResponse = await api.get(`/api/bagagem/passageiro/${passenger.id}`);
              return { ...passenger, luggageCount: luggageResponse.data.length };
            })
          );
          setPassengers(passengersWithLuggage);
          setPackages(packagesRes.data);
        }

      } catch (error) { console.error('Erro ao buscar dados para impressão:', error); }
      finally { setLoading(false); }
    };
    fetchAllData();
  }, [tripId]);

  // Efeito para disparar a impressão
  useEffect(() => {
    if (loading === false && trip && bus) { // Espera também pelo autocarro (ônibus)
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, trip, bus]);

  // Efeito para voltar à página anterior após imprimir
  useEffect(() => {
    const handleAfterPrint = () => {
      navigate(-1); 
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

  if (!trip || !bus) {
    return <div className="p-10">Viagem ou Ônibus não encontrado.</div>;
  }

  return (
    <div className="p-10 space-y-6 pt-print-container">
      {/* Cabeçalho da Impressão */}
      <div className="flex justify-between items-center mb-6">
        <img src={logo} alt="Patricio Turismo" className="h-12 w-auto" />
        <div className="text-right">
          <h1 className="text-2xl font-bold">Relatório de Viagem</h1>
          <p className="text-muted-foreground">Bahia ↔ São Paulo</p>
        </div>
      </div>
      
      {/* Card de Informações da Viagem (Corrigido) */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de viagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div><p className="text-sm text-muted-foreground">Data</p><p>{new Date(trip.dataHoraPartida).toLocaleDateString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Partida</p><p>{new Date(trip.dataHoraPartida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
            <div><p className="text-sm text-muted-foreground">Chegada</p><p>{new Date(trip.dataHoraChegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
            {/* --- CORREÇÃO AQUI --- */}
            <div><p className="text-sm text-muted-foreground">Ônibus</p><p>{bus.placa}</p></div>
            <div><p className="text-sm text-muted-foreground">Modelo</p><p>{bus.modelo}</p></div>
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