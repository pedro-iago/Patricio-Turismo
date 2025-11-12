package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.PassageiroViagem;
import java.math.BigDecimal;
import java.time.LocalDateTime; // <-- IMPORT NECESSÁRIO

/**
 * DTO de Resposta Completo para PassageiroViagem.
 * AGORA INCLUI OS DADOS DA VIAGEM.
 */
public record PassengerResponseDto(
        Long id,
        PessoaDto pessoa,
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,
        AffiliateResponseDto taxista,
        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago,
        String numeroAssento,
        ViagemDto viagem // <-- CAMPO NOVO
) {
    // Construtor de conveniência para converter a Entidade
    public PassengerResponseDto(PassageiroViagem pv) {
        this(
                pv.getId(),
                new PessoaDto(pv.getPessoa()),
                new EnderecoDto(pv.getEnderecoColeta()),
                new EnderecoDto(pv.getEnderecoEntrega()),
                pv.getTaxista() != null ? new AffiliateResponseDto(pv.getTaxista()) : null,
                pv.getComisseiro() != null ? new AffiliateResponseDto(pv.getComisseiro()) : null,
                pv.getValor(),
                pv.getMetodoPagamento(),
                pv.isPago(),
                pv.getAssento() != null ? pv.getAssento().getNumero() : null,

                pv.getViagem() != null ? new ViagemDto(
                        pv.getViagem().getId(),
                        pv.getViagem().getDataHoraPartida(),
                        pv.getViagem().getDataHoraChegada(),
                        // === CORREÇÃO AQUI ===
                        // Chamando .getIdOnibus() em vez de .getId()
                        (pv.getViagem().getOnibus() != null) ? pv.getViagem().getOnibus().getIdOnibus() : null
                ) : null
        );
    }
}