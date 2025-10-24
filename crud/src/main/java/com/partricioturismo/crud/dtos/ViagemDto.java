package com.partricioturismo.crud.dtos;

import java.time.LocalDateTime; // <-- MUDOU

public record ViagemDto(
        Long id,
        LocalDateTime dataHoraPartida,
        LocalDateTime dataHoraChegada,
        Long onibusId // <-- MUDOU (precisa ser Long)
) {
}