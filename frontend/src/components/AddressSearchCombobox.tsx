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
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

// Props que o componente irá receber
interface AddressSearchComboboxProps {
  value: number | null; // O ID do endereço selecionado
  onSelect: (addressId: number) => void;
  onAddNew: () => void;
  onClear: () => void;
  placeholder?: string;
}

// Helper para formatar o endereço
const formatAddress = (addr: AddressDto) => {
  return `${addr.logradouro}, ${addr.numero} (${addr.cidade})`;
};

export function AddressSearchCombobox({
  value,
  onSelect,
  onAddNew,
  onClear,
  placeholder = "Selecione ou pesquise um endereço..."
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
    setSearchQuery('');
  };

  const handleAddNewClick = () => {
    setOpen(false);
    onAddNew();
  };

  return (
    // ===== CORREÇÃO AQUI =====
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedAddress ? formatAddress(selectedAddress) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Digite a rua ou CEP..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 flex justify-center items-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            
            {!isLoading && options.length === 0 && searchQuery.length > 1 && (
              <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
            )}

            <CommandGroup>
              {options.map((address) => (
                <CommandItem
                  key={address.id}
                  value={formatAddress(address)}
                  onSelect={() => handleSelect(address)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === address.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p className="text-sm">{address.logradouro}, {address.numero}</p>
                    <p className="text-xs text-muted-foreground">{address.bairro} - {address.cidade} ({address.cep})</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandGroup className="border-t">
              <CommandItem
                onSelect={handleAddNewClick}
                className="text-primary hover:bg-accent cursor-pointer"
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