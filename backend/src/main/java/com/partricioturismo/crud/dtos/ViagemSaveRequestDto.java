package com.partricioturismo.crud.dtos;

import java.time.LocalDateTime;
import java.util.List;

public record ViagemSaveRequestDto(
        LocalDateTime dataHoraPartida,
        LocalDateTime dataHoraChegada,
        List<Long> onibusIds // <-- Lista de IDs para vincular
) {
}