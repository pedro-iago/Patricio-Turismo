package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Endereco;

// DTO para a entidade Endereco
public record EnderecoDto(
        Long id,
        String logradouro,
        String numero,
        String bairro,
        String cidade,
        String estado,
        String cep
) {
    // Construtor de conveniência para converter da Entidade
    public EnderecoDto(Endereco endereco) {
        this(
                endereco.getId(),
                endereco.getLogradouro(),
                endereco.getNumero(),
                endereco.getBairro(),
                endereco.getCidade(),
                endereco.getEstado(),
                endereco.getCep()
        );
    }
}
