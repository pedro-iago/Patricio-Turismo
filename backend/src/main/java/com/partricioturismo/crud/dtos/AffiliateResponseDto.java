package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Comisseiro;
import com.partricioturismo.crud.model.Taxista;

public record AffiliateResponseDto(
        Long id,
        PessoaDto pessoa
) {
    public AffiliateResponseDto(Taxista taxista) {
        this(
                taxista.getId(),
                new PessoaDto(
                        taxista.getPessoa().getId(),
                        taxista.getPessoa().getNome(),
                        taxista.getPessoa().getCpf(),
                        taxista.getPessoa().getTelefones(), // <--- CORRIGIDO: Plural (Lista)
                        taxista.getPessoa().getIdade()
                )
        );
    }

    public AffiliateResponseDto(Comisseiro comisseiro) {
        this(
                comisseiro.getId(),
                new PessoaDto(
                        comisseiro.getPessoa().getId(),
                        comisseiro.getPessoa().getNome(),
                        comisseiro.getPessoa().getCpf(),
                        comisseiro.getPessoa().getTelefones(), // <--- CORRIGIDO: Plural (Lista)
                        comisseiro.getPessoa().getIdade()
                )
        );
    }
}