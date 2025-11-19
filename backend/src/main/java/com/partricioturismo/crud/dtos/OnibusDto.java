package com.partricioturismo.crud.dtos;

public record OnibusDto(
        Long id,
        String modelo,
        String placa,
        int capacidadePassageiros,
        String layoutJson // Campo obrigatório para o Service funcionar
) {
}