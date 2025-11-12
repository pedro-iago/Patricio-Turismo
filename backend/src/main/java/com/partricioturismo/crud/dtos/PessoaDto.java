package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Pessoa;

public record PessoaDto(
        Long id,
        String nome,
        String cpf,
        String telefone,
        Integer idade
) {
    // --- CONSTRUTOR NOVO ---
    // Construtor de conveniência para converter da Entidade
    public PessoaDto(Pessoa pessoa) {
        this(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getCpf(),
                pessoa.getTelefone(),
                pessoa.getIdade()
        );
    }
}