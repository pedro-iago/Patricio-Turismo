package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;

/**
 * DTO para CRIAR ou ATUALIZAR um PassageiroViagem.
 * Agora inclui o assentoId opcional.
 */
public record PassengerSaveRequestDto(
        Long pessoaId,
        Long enderecoColetaId,
        Long enderecoEntregaId,
        Long viagemId,
        Long taxistaId,
        Long comisseiroId,
        BigDecimal valor,
        String metodoPagamento,
        Boolean pago,
        Long assentoId // <-- CAMPO NOVO (pode ser nulo)
) {
}