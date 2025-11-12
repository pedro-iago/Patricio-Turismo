import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react';
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
import { cn } from '@/components/ui/utils'; // Verifique se o 'utils.ts' está neste caminho
import api from '@/services/api';

// Tipo para os dados da Pessoa que vêm da API
interface PessoaDto {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  idade: number | null;
}

// Props que o componente irá receber
interface PessoaSearchComboboxProps {
  /** O ID da pessoa atualmente selecionada */
  value: number | null; 
  /** Função chamada quando uma pessoa é selecionada */
  onSelect: (pessoaId: number) => void;
  /** Função chamada quando o utilizador clica em "Nova Pessoa" */
  onAddNew: () => void; 
  /** Função chamada quando o utilizador limpa a seleção */
  onClear: () => void;
}

export function PessoaSearchCombobox({
  value,
  onSelect,
  onAddNew,
  onClear
}: PessoaSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<PessoaDto[]>([]);
  
  // Guarda os dados da pessoa selecionada para mostrar o nome no botão
  const [selectedPessoa, setSelectedPessoa] = useState<PessoaDto | null>(null);

  // Efeito para buscar a pessoa selecionada (quando 'value' é pré-definido)
  useEffect(() => {
    if (value && (!selectedPessoa || selectedPessoa.id !== value)) {
      api.get(`/api/pessoa/${value}`).then((response) => {
        setSelectedPessoa(response.data);
      }).catch(() => {
        // Se falhar (ex: pessoa apagada), limpa a seleção
        onClear();
      });
    } else if (!value) {
      setSelectedPessoa(null);
    }
  }, [value, selectedPessoa, onClear]);

  // Efeito para buscar pessoas (com debounce)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timerId = setTimeout(() => {
      api.get(`/api/pessoa/search?query=${searchQuery}`)
        .then((response) => {
          setOptions(response.data);
        })
        .catch((error) => {
          console.error("Erro ao buscar pessoas:", error);
          setOptions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 500); // 500ms de debounce

    return () => clearTimeout(timerId);
  }, [searchQuery]);
  
  const handleSelect = (pessoa: PessoaDto) => {
    onSelect(pessoa.id); // Informa o formulário pai sobre o ID
    setSelectedPessoa(pessoa); // Guarda os dados para mostrar o nome
    setOpen(false); // Fecha o popover
    setSearchQuery(''); // Limpa a busca
  };

  const handleAddNewClick = () => {
    setOpen(false); // Fecha o popover
    onAddNew(); // Informa o formulário pai para abrir o PersonModal
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
          {selectedPessoa
            ? `${selectedPessoa.nome} (${selectedPessoa.cpf})`
            : "Selecione ou pesquise uma pessoa..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Digite o nome ou CPF..."
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
              <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
            )}

            <CommandGroup>
              {options.map((pessoa) => (
                <CommandItem
                  key={pessoa.id}
                  value={`${pessoa.nome} ${pessoa.cpf}`} // Valor usado para filtragem interna
                  onSelect={() => handleSelect(pessoa)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === pessoa.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <p className="text-sm">{pessoa.nome}</p>
                    <p className="text-xs text-muted-foreground">{pessoa.cpf}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {/* Opção "Adicionar Novo" */}
            <CommandGroup className="border-t">
              <CommandItem
                onSelect={handleAddNewClick}
                className="text-primary hover:bg-accent cursor-pointer"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar nova pessoa
              </CommandItem>
            </CommandGroup>

          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}