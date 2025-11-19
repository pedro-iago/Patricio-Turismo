package com.partricioturismo.crud.dtos;

import java.time.LocalDateTime;
import java.util.List;

public record ViagemDto(
        Long id,
        LocalDateTime dataHoraPartida,
        LocalDateTime dataHoraChegada,
        List<OnibusDto> onibus // Deve ser LISTA
) {
}