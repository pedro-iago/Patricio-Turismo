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

        // --- MUDANÇA AQUI ---
        // Long taxistaId, // <-- REMOVIDO
        Long taxistaColetaId, // <-- ADICIONADO
        Long taxistaEntregaId, // <-- ADICIONADO
        // --- FIM DA MUDANÇA ---

        Long comisseiroId,
        BigDecimal valor,
        String metodoPagamento,
        Boolean pago
) {
}