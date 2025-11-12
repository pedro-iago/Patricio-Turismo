package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Assento;

/**
 * DTO para retornar a lista de assentos ao frontend.
 * Usa um boolean simples para o status.
 */
public record AssentoDto(
        Long id,
        String numero,
        boolean ocupado, // <-- MUDANÇA: Agora é boolean
        PessoaDto passageiro // Inclui os dados da pessoa (nome/cpf) se estiver ocupado
) {
    // Construtor de conveniência para converter da Entidade
    public AssentoDto(Assento assento) {
        this(
                assento.getId(),
                assento.getNumero(),
                assento.isOcupado(), // <-- MUDANÇA: Usa isOcupado()
                // Se o assento tiver um passageiro (e estiver ocupado), inclui a Pessoa
                (assento.isOcupado() && assento.getPassageiroViagem() != null
                        && assento.getPassageiroViagem().getPessoa() != null)
                        ? new PessoaDto(assento.getPassageiroViagem().getPessoa())
                        : null
        );
    }
}