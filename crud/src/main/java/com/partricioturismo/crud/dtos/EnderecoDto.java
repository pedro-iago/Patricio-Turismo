package com.partricioturismo.crud.dtos;

// Usando 'record' para DTO, que é mais moderno e limpo
public record EnderecoDto(Long id, String logradouro, String numero, String bairro, String cidade, String estado, String cep) {
}