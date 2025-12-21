package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.PassageiroViagem;
import java.math.BigDecimal;
import java.util.stream.Collectors;

public record PassengerResponseDto(
        Long id,
        PessoaDto pessoa,
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,
        AffiliateResponseDto taxistaColeta,
        AffiliateResponseDto taxistaEntrega,
        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago,
        String numeroAssento,
        Long onibusId,
        String corTag,
        Integer ordem,
        String grupoId,
        ViagemDto viagem
) {
    public PassengerResponseDto(PassageiroViagem pv) {
        this(
                pv.getId(),
                new PessoaDto(pv.getPessoa()),
                pv.getEnderecoColeta() != null ? new EnderecoDto(pv.getEnderecoColeta()) : null,
                pv.getEnderecoEntrega() != null ? new EnderecoDto(pv.getEnderecoEntrega()) : null,

                pv.getTaxistaColeta() != null ? new AffiliateResponseDto(pv.getTaxistaColeta()) : null,
                pv.getTaxistaEntrega() != null ? new AffiliateResponseDto(pv.getTaxistaEntrega()) : null,

                pv.getComisseiro() != null ? new AffiliateResponseDto(pv.getComisseiro()) : null,
                pv.getValor(),
                pv.getMetodoPagamento(),
                pv.isPago(),

                pv.getAssento() != null ? pv.getAssento().getNumero() : null,

                (pv.getAssento() != null && pv.getAssento().getOnibus() != null)
                        ? pv.getAssento().getOnibus().getIdOnibus()
                        : null,

                pv.getCorTag(),
                pv.getOrdem(),
                pv.getGrupoId(),

                // ATUALIZADO: Construtor do ViagemDto com os novos campos
                pv.getViagem() != null ? new ViagemDto(
                        pv.getViagem().getId(),
                        pv.getViagem().getDataHoraPartida(),
                        pv.getViagem().getDataHoraChegada(),
                        pv.getViagem().getListaOnibus().stream()
                                .map(o -> new OnibusDto(
                                        o.getIdOnibus(),
                                        o.getModelo(),
                                        o.getPlaca(),
                                        o.getCapacidadePassageiros(),
                                        o.getLayoutJson()))
                                .collect(Collectors.toList()),
                        // Passamos os totais aqui também
                        pv.getViagem().getTotalPassageiros(),
                        pv.getViagem().getTotalEncomendas()
                ) : null
        );
    }
}