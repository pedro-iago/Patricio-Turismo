package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;

public record EncomendaDto(Long id, String descricao, BigDecimal peso, Long viagemId, Long remetenteId, Long destinatarioId, Long enderecoColetaId, Long enderecoEntregaId, Long responsavelId) {
}