package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Encomenda;
import java.math.BigDecimal;
import java.util.stream.Collectors;

public record EncomendaResponseDto(
        Long id,
        String descricao,
        PessoaDto remetente,
        PessoaDto destinatario,
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,
        AffiliateResponseDto taxistaColeta,
        AffiliateResponseDto taxistaEntrega,
        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago,
        ViagemDto viagem
) {
    public EncomendaResponseDto(Encomenda e) {
        this(
                e.getId(),
                e.getDescricao(),
                new PessoaDto(e.getRemetente()),
                new PessoaDto(e.getDestinatario()),
                e.getEnderecoColeta() != null ? new EnderecoDto(e.getEnderecoColeta()) : null,
                e.getEnderecoEntrega() != null ? new EnderecoDto(e.getEnderecoEntrega()) : null,
                e.getTaxistaColeta() != null ? new AffiliateResponseDto(e.getTaxistaColeta()) : null,
                e.getTaxistaEntrega() != null ? new AffiliateResponseDto(e.getTaxistaEntrega()) : null,
                e.getComisseiro() != null ? new AffiliateResponseDto(e.getComisseiro()) : null,
                e.getValor(),
                e.getMetodoPagamento(),
                e.isPago(),

                // --- CORREÇÃO AQUI ---
                e.getViagem() != null ? new ViagemDto(
                        e.getViagem().getId(),
                        e.getViagem().getDataHoraPartida(),
                        e.getViagem().getDataHoraChegada(),
                        e.getViagem().getListaOnibus().stream()
                                .map(o -> new OnibusDto(
                                        o.getIdOnibus(),
                                        o.getModelo(),
                                        o.getPlaca(),
                                        o.getCapacidadePassageiros(),
                                        o.getLayoutJson()))
                                .collect(Collectors.toList()),
                        // Passando os totais calculados pelo @Formula
                        e.getViagem().getTotalPassageiros(),
                        e.getViagem().getTotalEncomendas()
                ) : null
        );
    }
}