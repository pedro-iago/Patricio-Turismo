package com.partricioturismo.crud.dtos;

import java.util.List;

public record BulkAssignRequestDto(
        List<Long> passageiroIds,
        List<Long> encomendaIds, // <--- NOVO CAMPO
        Long taxistaId,
        String tipo // "COLETA" ou "ENTREGA"
) {}