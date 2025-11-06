package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.PassageiroViagem;
import java.math.BigDecimal;

// DTO de Resposta Completo para PassageiroViagem
public record PassengerResponseDto(
        Long id,
        PessoaDto pessoa,
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,
        AffiliateResponseDto taxista,
        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago
) {
    // Construtor de conveniência para converter a Entidade
    public PassengerResponseDto(PassageiroViagem pv) {
        this(
                pv.getId(),

                // --- CORREÇÃO AQUI ---
                // Desempacota o objeto Pessoa nos 5 argumentos do construtor PessoaDto
                new PessoaDto(
                        pv.getPessoa().getId(),
                        pv.getPessoa().getNome(),
                        pv.getPessoa().getCpf(),
                        pv.getPessoa().getTelefone(),
                        pv.getPessoa().getIdade()
                ),

                new EnderecoDto(pv.getEnderecoColeta()),
                new EnderecoDto(pv.getEnderecoEntrega()),
                pv.getTaxista() != null ? new AffiliateResponseDto(pv.getTaxista()) : null,
                pv.getComisseiro() != null ? new AffiliateResponseDto(pv.getComisseiro()) : null,
                pv.getValor(),
                pv.getMetodoPagamento(),
                pv.isPago()
        );
    }
}