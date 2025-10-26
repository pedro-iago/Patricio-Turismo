package com.partricioturismo.crud.dtos;

public record EnderecoDto(Long id, String logradouro, String numero, String bairro, String cidade, String estado, String cep) {
}