package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Encomenda;
import java.math.BigDecimal;
import java.util.stream.Collectors;

public record EncomendaResponseDto(
        Long id,
        String descricao,
        BigDecimal peso,
        PessoaDto remetente,
        PessoaDto destinatario,
        PessoaDto responsavel,
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,
        AffiliateResponseDto taxistaColeta,
        AffiliateResponseDto taxistaEntrega,
        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago,
        String corTag, // Campo existe aqui
        ViagemDto viagem
) {
    public EncomendaResponseDto(Encomenda e) {
        this(
                e.getId(),
                e.getDescricao(),
                e.getPeso(),
                new PessoaDto(e.getRemetente()),
                new PessoaDto(e.getDestinatario()),
                e.getResponsavel() != null ? new PessoaDto(e.getResponsavel()) : null,
                e.getEnderecoColeta() != null ? new EnderecoDto(e.getEnderecoColeta()) : null,
                e.getEnderecoEntrega() != null ? new EnderecoDto(e.getEnderecoEntrega()) : null,
                e.getTaxistaColeta() != null ? new AffiliateResponseDto(e.getTaxistaColeta()) : null,
                e.getTaxistaEntrega() != null ? new AffiliateResponseDto(e.getTaxistaEntrega()) : null,
                e.getComisseiro() != null ? new AffiliateResponseDto(e.getComisseiro()) : null,
                e.getValor(),
                e.getMetodoPagamento(),
                e.isPago(),

                // --- CORREÇÃO: ADICIONE ESTA LINHA PARA MAPEAR O corTag ---
                e.getCorTag(), // <-- Mapeia o valor da entidade
                // --------------------------------------------------------

                // CORREÇÃO DA LISTA DE ÔNIBUS
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
                                .collect(Collectors.toList())
                ) : null
        );
    }
}