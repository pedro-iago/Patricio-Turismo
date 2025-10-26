package com.partricioturismo.crud.dtos;

public record PessoaDto(
        Long id,
        String nome,
        String cpf,
        String telefone,
        Integer idade
) {
}