package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Onibus;

import java.time.LocalDate;

public record ViagemDto(Integer idViagem, LocalDate dataPartida, LocalDate dataChegada, Integer onibusId) {
}
