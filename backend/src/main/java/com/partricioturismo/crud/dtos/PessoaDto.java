package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Pessoa;

public record PessoaDto(
        Long id,
        String nome,
        String cpf,
        String telefone,
        Integer idade
) {
}