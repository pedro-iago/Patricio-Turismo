import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/components/ui/utils';
import api from '@/services/api';

// Interface para o DTO do Endereço
interface AddressDto {
  id: number;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string;
  estado: string;
  cep: string | null;
}

// Props que o componente irá receber
interface AddressSearchComboboxProps {
  value: number | null; // O ID do endereço selecionado
  onSelect: (addressId: number) => void;
  onAddNew: () => void;
  onClear: () => void;
  placeholder?: string;
}

// Helper para formatar o endereço de forma limpa (sem vírgulas soltas)
const formatAddressLabel = (addr: AddressDto) => {
  const parts = [];
  if (addr.logradouro) parts.push(addr.logradouro);
  if (addr.numero) parts.push(addr.numero);
  
  const streetPart = parts.join(', ');
  const cityPart = addr.bairro ? `${addr.bairro} - ${addr.cidade}` : addr.cidade;

  if (!streetPart) return cityPart; // Se não tem rua, mostra só cidade/bairro
  return `${streetPart} (${cityPart})`;
};

export function AddressSearchCombobox({
  value,
  onSelect,
  onAddNew,
  onClear,
  placeholder = "Selecione ou pesquise..."
}: AddressSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<AddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressDto | null>(null);

  // Efeito para buscar o endereço selecionado (para mostrar o nome)
  useEffect(() => {
    if (value && (!selectedAddress || selectedAddress.id !== value)) {
      api.get(`/api/endereco/${value}`).then((response) => {
        setSelectedAddress(response.data);
      }).catch(() => {
        onClear();
      });
    } else if (!value) {
      setSelectedAddress(null);
    }
  }, [value, selectedAddress, onClear]);

  // Efeito para buscar endereços (com debounce)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timerId = setTimeout(() => {
      api.get(`/api/endereco/search?query=${searchQuery}`)
        .then((response) => {
          setOptions(response.data);
        })
        .catch((error) => {
          console.error("Erro ao buscar endereços:", error);
          setOptions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 500); // 500ms de debounce

    return () => clearTimeout(timerId);
  }, [searchQuery]);
  
  const handleSelect = (address: AddressDto) => {
    onSelect(address.id);
    setSelectedAddress(address);
    setOpen(false);
    // Não limpamos a query para não piscar a lista, opcional
  };

  const handleAddNewClick = () => {
    setOpen(false);
    onAddNew();
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left"
        >
          <span className="truncate">
            {selectedAddress ? formatAddressLabel(selectedAddress) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {/* IMPORTANTE: 'shouldFilter={false}' desativa a filtragem nativa do CMDK.
            Isso permite que a gente mostre exatamente o que a API retornou,
            resolvendo o problema de buscar por bairro e não achar.
        */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Busque por rua, bairro ou cidade..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 flex justify-center items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!isLoading && options.length === 0 && searchQuery.length > 1 && (
              <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
            )}

            <CommandGroup>
              {options.map((address) => {
                // Cria um valor único e legível para o item
                const uniqueValue = `${address.id}-${address.logradouro || ''}-${address.cidade}`;
                
                return (
                  <CommandItem
                    key={address.id}
                    value={uniqueValue} // Valor único para evitar bugs de seleção
                    onSelect={() => handleSelect(address)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === address.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                        {/* Lógica visual: Se tem rua, destaca a rua. Se não, destaca o bairro/cidade */}
                        {address.logradouro ? (
                            <>
                                <span className="font-medium text-sm">
                                    {address.logradouro}, {address.numero || 'S/N'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {address.bairro ? `${address.bairro} - ` : ''}{address.cidade}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="font-medium text-sm">
                                    {address.bairro || 'Centro'} - {address.cidade}
                                </span>
                                <span className="text-xs text-muted-foreground italic">
                                    Sem logradouro específico
                                </span>
                            </>
                        )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            
            <CommandGroup className="border-t pt-1 mt-1">
              <CommandItem
                onSelect={handleAddNewClick}
                className="text-primary aria-selected:bg-primary/10 cursor-pointer font-medium"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar novo endereço
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}