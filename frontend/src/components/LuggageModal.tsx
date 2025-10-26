import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import axios from 'axios';

// --- Interfaces do Backend ---
interface Luggage {
  id: number;
  descricao: string;
  peso?: number | null;
}

interface Person {
  id: number; // Mantido como 'id'
  nome: string;
}

interface PassengerData {
  id: number;
  pessoa: Person;
}

interface LuggageModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: PassengerData | null;
}

export default function LuggageModal({
  isOpen,
  onClose,
  passenger,
}: LuggageModalProps) {
  const [items, setItems] = useState<Luggage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLuggage = async () => {
    if (!passenger) return;
    setLoading(true);
    try {
      const response = await api.get(`/bagagem/passageiro/${passenger.id}`);
      console.log(`Dados recebidos em fetchLuggage para passageiro ${passenger.id}:`, response.data);
      setItems(response.data);
    } catch (error) {
      console.error("Erro ao buscar bagagens:", error);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && passenger) {
      fetchLuggage();
    } else if (!isOpen) {
      setItems([]);
    }
  }, [isOpen, passenger]);

  // handleAddItem (sem mudanças)
  const handleAddItem = async () => {
    if (!passenger || !passenger.id || !passenger.pessoa || !passenger.pessoa.id) {
      console.error("Dados do passageiro ou pessoa estão incompletos ou inválidos:", passenger);
      alert("Erro: Não foi possível identificar o passageiro ou a pessoa responsável.");
      return;
    }
    console.log("Tentando adicionar bagagem para:");
    console.log("PassageiroViagem ID (passenger.id):", passenger.id);
    console.log("Pessoa Responsável ID (passenger.pessoa.id):", passenger.pessoa.id);

    const newLuggageDto = {
      descricao: "Nova Bagagem",
      peso: 0,
      passageiroViagemId: passenger.id,
      responsavelId: passenger.pessoa.id
    };
    console.log("Enviando DTO:", newLuggageDto);

    try {
      await api.post('/bagagem', newLuggageDto);
      await fetchLuggage();
    } catch (error) {
      console.error("Erro ao adicionar bagagem:", error);
      if (axios.isAxiosError(error) && error.response && error.response.data) {
         console.error("Detalhes do erro do backend:", error.response.data);
         const backendMessage = typeof error.response.data === 'string' ? error.response.data : error.response.data?.message || 'Erro desconhecido do servidor.';
         alert(`Falha ao adicionar bagagem: ${backendMessage}`);
      } else {
         alert("Falha ao adicionar bagagem. Verifique o console para detalhes.");
      }
    }
  };

  // handleRemoveItem (sem mudanças)
  const handleRemoveItem = async (id: number) => {
    try {
      await api.delete(`/bagagem/${id}`);
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Erro ao remover bagagem:", error);
      if (axios.isAxiosError(error) && error.response && error.response.data) {
         console.error("Detalhes do erro do backend:", error.response.data);
         alert(`Falha ao remover bagagem: ${error.response.data?.message || 'Erro desconhecido.'}`);
      } else {
         alert("Falha ao remover bagagem.");
      }
    }
  };

  // --- FUNÇÃO handleUpdateItem ATUALIZADA ---
  // Agora chama a API PUT para salvar as alterações
  const handleUpdateItem = async (id: number, field: keyof Luggage, value: any) => {
    // 1. Atualiza o estado local PRIMEIRO (para feedback imediato)
    let updatedItem: Luggage | undefined;
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          // Garante que o peso seja null se o valor for uma string vazia
          const actualValue = (field === 'peso' && value === '') ? null : value;
          updatedItem = { ...item, [field]: actualValue };
          return updatedItem;
        }
        return item;
      })
    );

    // 2. Prepara o DTO para o backend
    if (updatedItem && passenger && passenger.pessoa) {
      const luggageDto = {
        // Campos do BagagemDto
        descricao: updatedItem.descricao,
        // Envia null se peso for null/undefined, senão envia o número
        peso: updatedItem.peso ?? null,
        passageiroViagemId: passenger.id,
        responsavelId: passenger.pessoa.id
      };

      try {
        // 3. Chama a API PUT
        console.log(`Enviando PUT /bagagem/${id} com DTO:`, luggageDto); // Log
        await api.put(`/bagagem/${id}`, luggageDto);
        // Não precisa chamar fetchLuggage aqui, o estado local já reflete a mudança.
      } catch (error) {
        console.error(`Erro ao atualizar bagagem ${id}:`, error);
        alert("Falha ao salvar alteração da bagagem."); // Mensagem para o usuário
        if (axios.isAxiosError(error) && error.response && error.response.data) {
           console.error("Detalhes do erro do backend:", error.response.data);
        }
        // Opcional: Reverter a mudança no estado local se a API falhar
        // fetchLuggage(); // Busca tudo de novo para reverter
      }
    } else {
        console.error("Não foi possível encontrar o item atualizado ou dados do passageiro para salvar.");
    }
  };
  // --- FIM DA ATUALIZAÇÃO ---


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar bagagem - {passenger?.pessoa?.nome || 'Passenger'}</DialogTitle>
          <DialogDescription>
           Adicione ou remova itens de bagagem para este passageiro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma bagagem. Clique em "Adicionar Item" para adicionar bagagem.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-end gap-3 p-4 bg-gray-100 rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`desc-${item.id}`}>Descrição</Label>
                    <Input
                      id={`desc-${item.id}`}
                      value={item.descricao || ''}
                      onChange={(e) =>
                        handleUpdateItem(item.id, 'descricao', e.target.value) // Chama a função atualizada
                      }
                      placeholder="e.g., Suitcase, Backpack"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`weight-${item.id}`}>Peso (kg)</Label>
                    <Input
                      id={`weight-${item.id}`}
                      type="number"
                      value={item.peso ?? ''}
                      onChange={(e) =>
                        handleUpdateItem( // Chama a função atualizada
                          item.id,
                          'peso',
                          // Mantém a lógica de conversão para null ou float
                          e.target.value === '' ? null : parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full gap-2"
            disabled={!passenger || loading}
          >
            <Plus className="w-4 h-4" />
            Adicionar item
          </Button>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}