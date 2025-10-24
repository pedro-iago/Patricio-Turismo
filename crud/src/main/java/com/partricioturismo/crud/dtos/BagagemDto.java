package com.partricioturismo.crud.dtos;

import java.math.BigDecimal;

public record BagagemDto(Long id, BigDecimal peso, String descricao, Long passageiroViagemId, Long responsavelId) {
}