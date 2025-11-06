package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;

// Este record reflete o JSON que o frontend REALMENTE envia
// Note que 'id' não está aqui (porque é um create)
// E 'viagemId' está aqui (porque a TripDetailsPage o adiciona)

public record PassengerSaveRequestDto(
        Long pessoaId,
        Long enderecoColetaId,
        Long enderecoEntregaId,
        Long viagemId, // <-- O ID da viagem
        Long taxistaId,
        Long comisseiroId,
        BigDecimal valor,
        String metodoPagamento,
        Boolean pago
) {
}