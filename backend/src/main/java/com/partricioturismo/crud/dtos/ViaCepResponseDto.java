package com.partricioturismo.crud.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// Este DTO mapeia a resposta da API externa do ViaCEP
// Ignoramos campos que não vamos usar (como "gia", "ibge", etc.)
@JsonIgnoreProperties(ignoreUnknown = true)
public record ViaCepResponseDto(
        String cep,
        String logradouro,
        String bairro,
        String localidade, // O ViaCEP chama "cidade" de "localidade"
        String uf, // O ViaCEP chama "estado" de "uf"
        String erro // O ViaCEP retorna "true" neste campo se o CEP não for encontrado
) {
}