package com.partricioturismo.crud.dtos;

import java.time.LocalDateTime;

/**
 * Este DTO é usado APENAS para Criar (POST) ou Atualizar (PUT) uma Viagem.
 * Note a ausência do campo 'id'.
 */
public record ViagemSaveRequestDto(
        LocalDateTime dataHoraPartida,
        LocalDateTime dataHoraChegada,
        Long onibusId
) {
}