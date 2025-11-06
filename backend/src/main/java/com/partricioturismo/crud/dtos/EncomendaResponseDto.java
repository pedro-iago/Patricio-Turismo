package com.partricioturismo.crud.dtos;

import com.partricioturismo.crud.model.Encomenda;
import java.math.BigDecimal;

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
        AffiliateResponseDto taxista,
        AffiliateResponseDto comisseiro,
        BigDecimal valor,
        String metodoPagamento,
        boolean pago
) {
    // Construtor de conveniência para converter da Entidade
    public EncomendaResponseDto(Encomenda e) {
        this(
                e.getId(),
                e.getDescricao(),
                e.getPeso(),

                // --- CORREÇÃO AQUI (REMETENTE) ---
                new PessoaDto(
                        e.getRemetente().getId(),
                        e.getRemetente().getNome(),
                        e.getRemetente().getCpf(),
                        e.getRemetente().getTelefone(),
                        e.getRemetente().getIdade()
                ),

                // --- CORREÇÃO AQUI (DESTINATÁRIO) ---
                new PessoaDto(
                        e.getDestinatario().getId(),
                        e.getDestinatario().getNome(),
                        e.getDestinatario().getCpf(),
                        e.getDestinatario().getTelefone(),
                        e.getDestinatario().getIdade()
                ),

                new EnderecoDto(e.getEnderecoColeta()),
                new EnderecoDto(e.getEnderecoEntrega()),

                // --- CORREÇÃO AQUI (RESPONSÁVEL) ---
                e.getResponsavel() != null ? new PessoaDto(
                        e.getResponsavel().getId(),
                        e.getResponsavel().getNome(),
                        e.getResponsavel().getCpf(),
                        e.getResponsavel().getTelefone(),
                        e.getResponsavel().getIdade()
                ) : null,

                e.getTaxista() != null ? new AffiliateResponseDto(e.getTaxista()) : null,
                e.getComisseiro() != null ? new AffiliateResponseDto(e.getComisseiro()) : null,
                e.getValor(),
                e.getMetodoPagamento(),
                e.isPago()
        );
    }
}