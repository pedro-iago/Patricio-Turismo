package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Encomenda;
import java.math.BigDecimal;
import java.time.LocalDateTime; // <-- IMPORT NECESSÁRIO

// Este é o DTO para RETORNAR uma Encomenda (evita o bug de Lazy Loading)
public record EncomendaResponseDto(
        Long id,
        String descricao,
        BigDecimal peso,
        PessoaDto remetente,
        PessoaDto destinatario,
        EnderecoDto enderecoColeta,
        EnderecoDto enderecoEntrega,
        PessoaDto responsavel,

        // --- MUDANÇA AQUI ---
        // AffiliateResponseDto taxista, // <-- REMOVIDO
        AffiliateResponseDto taxistaColeta, // <-- ADICIONADO
        AffiliateResponseDto taxistaEntrega, // <-- ADICIONADO
        // --- FIM DA MUDANÇA ---

        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago,
        ViagemDto viagem // <-- CAMPO NOVO
) {
    // Construtor de conveniência para converter da Entidade
    public EncomendaResponseDto(Encomenda e) {
        this(
                e.getId(),
                e.getDescricao(),
                e.getPeso(),
                new PessoaDto(
                        e.getRemetente().getId(),
                        e.getRemetente().getNome(),
                        e.getRemetente().getCpf(),
                        e.getRemetente().getTelefone(),
                        e.getRemetente().getIdade()
                ),
                new PessoaDto(
                        e.getDestinatario().getId(),
                        e.getDestinatario().getNome(),
                        e.getDestinatario().getCpf(),
                        e.getDestinatario().getTelefone(),
                        e.getDestinatario().getIdade()
                ),
                new EnderecoDto(e.getEnderecoColeta()),
                new EnderecoDto(e.getEnderecoEntrega()),
                e.getResponsavel() != null ? new PessoaDto(
                        e.getResponsavel().getId(),
                        e.getResponsavel().getNome(),
                        e.getResponsavel().getCpf(),
                        e.getResponsavel().getTelefone(),
                        e.getResponsavel().getIdade()
                ) : null,

                // --- MUDANÇA AQUI (Usa os novos getters da Entidade) ---
                e.getTaxistaColeta() != null ? new AffiliateResponseDto(e.getTaxistaColeta()) : null,
                e.getTaxistaEntrega() != null ? new AffiliateResponseDto(e.getTaxistaEntrega()) : null,
                // --- FIM DA MUDANÇA ---

                e.getComisseiro() != null ? new AffiliateResponseDto(e.getComisseiro()) : null,
                e.getValor(),
                e.getMetodoPagamento(),
                e.isPago(),

                e.getViagem() != null ? new ViagemDto(
                        e.getViagem().getId(),
                        e.getViagem().getDataHoraPartida(),
                        e.getViagem().getDataHoraChegada(),
                        // === CORREÇÃO AQUI ===
                        // Chamando .getIdOnibus() em vez de .getId()
                        (e.getViagem().getOnibus() != null) ? e.getViagem().getOnibus().getIdOnibus() : null
                ) : null
        );
    }
}