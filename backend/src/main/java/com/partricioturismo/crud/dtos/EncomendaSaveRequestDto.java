package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;

// Este é o DTO para CRIAR ou ATUALIZAR uma Encomenda
public record EncomendaSaveRequestDto(
        String descricao,
        BigDecimal peso,
        Long viagemId,
        Long remetenteId,
        Long destinatarioId,
        Long enderecoColetaId,
        Long enderecoEntregaId,
        Long responsavelId,
        Long taxistaId,
        Long comisseiroId,
        BigDecimal valor,
        String metodoPagamento,
        Boolean pago
) {
}