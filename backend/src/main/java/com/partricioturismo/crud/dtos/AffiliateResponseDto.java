package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Comisseiro;
import com.partricioturismo.crud.model.Taxista;

// DTO para aninhar a resposta do Afiliado
public record AffiliateResponseDto(
        Long id,
        PessoaDto pessoa
) {
    // Construtor de conveniência para Taxista
    public AffiliateResponseDto(Taxista taxista) {
        this(
                taxista.getId(),
                // --- CORREÇÃO AQUI ---
                // Desempacota o objeto Pessoa nos 5 argumentos do construtor PessoaDto
                new PessoaDto(
                        taxista.getPessoa().getId(),
                        taxista.getPessoa().getNome(),
                        taxista.getPessoa().getCpf(),
                        taxista.getPessoa().getTelefone(),
                        taxista.getPessoa().getIdade()
                )
        );
    }

    // Construtor de conveniência para Comisseiro
    public AffiliateResponseDto(Comisseiro comisseiro) {
        this(
                comisseiro.getId(),
                // --- CORREÇÃO AQUI ---
                // Desempacota o objeto Pessoa nos 5 argumentos do construtor PessoaDto
                new PessoaDto(
                        comisseiro.getPessoa().getId(),
                        comisseiro.getPessoa().getNome(),
                        comisseiro.getPessoa().getCpf(),
                        comisseiro.getPessoa().getTelefone(),
                        comisseiro.getPessoa().getIdade()
                )
        );
    }
}