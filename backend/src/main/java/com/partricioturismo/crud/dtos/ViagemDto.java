package com.partricioturismo.crud.dtos;

import java.time.LocalDateTime;
import java.util.List;

public record ViagemDto(
        Long id,
        LocalDateTime dataHoraPartida,
        LocalDateTime dataHoraChegada,
        List<OnibusDto> onibus,
        // Novos campos para os cards
        Integer totalPassageiros,
        Integer totalEncomendas
) {
}