package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Pessoa;
import java.util.List;

public record PessoaDto(
        Long id,
        String nome,
        String cpf,
        List<String> telefones, // <--- É uma LISTA
        Integer idade
) {
    public PessoaDto(Pessoa pessoa) {
        this(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getCpf(),
                pessoa.getTelefones(), // <--- CORREÇÃO: Use o Plural (retorna List<String>)
                pessoa.getIdade()
        );
    }
}