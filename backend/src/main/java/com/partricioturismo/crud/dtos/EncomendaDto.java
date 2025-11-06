package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;

public record EncomendaDto(
        Long id,
        String descricao,
        BigDecimal peso,
        Long viagemId,
        Long remetenteId,
        Long destinatarioId,
        Long enderecoColetaId,
        Long enderecoEntregaId,
        Long responsavelId,

        // --- NOVOS CAMPOS ADICIONADOS ---

        // Funcionalidade 1 (IDs dos Afiliados)
        Long taxistaId,
        Long comisseiroId,

        // Funcionalidade 2 (Pagamentos)
        BigDecimal valor,
        String metodoPagamento,
        Boolean pago // Usamos Boolean (objeto) para que possa ser nulo se não for enviado no JSON
) {
}