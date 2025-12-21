package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;
import java.util.List;

public record FamilyGroupRequestDto(
        Long viagemId,

        // Dados Compartilhados (se preenchidos, aplicam a todos)
        Long taxistaColetaId,
        Long taxistaEntregaId,
        Long comisseiroId,

        // Podemos receber o ID (se selecionou existente) ou o Objeto (se digitou novo)
        // Para simplificar a UX, vou assumir que o frontend manda o objeto do endereço
        // e o backend cria/reusa.
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,

        BigDecimal valorIndividual, // Valor sugerido por pessoa

        List<FamilyMemberDto> membros
) {}