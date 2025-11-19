package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "encomenda")
public class Encomenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descricao;
    private BigDecimal peso;

    @ManyToOne
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    @ManyToOne
    @JoinColumn(name = "remetente_id", nullable = false)
    private Pessoa remetente;

    @ManyToOne
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Pessoa destinatario;

    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    private Pessoa responsavel;

    @ManyToOne
    @JoinColumn(name = "endereco_coleta_id")
    private Endereco enderecoColeta;

    @ManyToOne
    @JoinColumn(name = "endereco_entrega_id")
    private Endereco enderecoEntrega;

    @ManyToOne
    @JoinColumn(name = "taxista_coleta_id")
    private Taxista taxistaColeta;

    @ManyToOne
    @JoinColumn(name = "taxista_entrega_id")
    private Taxista taxistaEntrega;

    @ManyToOne
    @JoinColumn(name = "comisseiro_id")
    private Comisseiro comisseiro;

    private BigDecimal valor;

    @Column(name = "metodo_pagamento")
    private String metodoPagamento;

    private boolean pago = false;

    // --- NOVOS CAMPOS (V11) ---
    @Column(name = "cor_tag")
    private String corTag;

    @Column(name = "ordem_grid")
    private Integer ordemGrid = 0;

    // --- GETTERS E SETTERS OBRIGATÓRIOS ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public BigDecimal getPeso() { return peso; }
    public void setPeso(BigDecimal peso) { this.peso = peso; }

    public Viagem getViagem() { return viagem; }
    public void setViagem(Viagem viagem) { this.viagem = viagem; }

    public Pessoa getRemetente() { return remetente; }
    public void setRemetente(Pessoa remetente) { this.remetente = remetente; }

    public Pessoa getDestinatario() { return destinatario; }
    public void setDestinatario(Pessoa destinatario) { this.destinatario = destinatario; }

    public Pessoa getResponsavel() { return responsavel; }
    public void setResponsavel(Pessoa responsavel) { this.responsavel = responsavel; }

    public Endereco getEnderecoColeta() { return enderecoColeta; }
    public void setEnderecoColeta(Endereco enderecoColeta) { this.enderecoColeta = enderecoColeta; }

    public Endereco getEnderecoEntrega() { return enderecoEntrega; }
    public void setEnderecoEntrega(Endereco enderecoEntrega) { this.enderecoEntrega = enderecoEntrega; }

    public Taxista getTaxistaColeta() { return taxistaColeta; }
    public void setTaxistaColeta(Taxista taxistaColeta) { this.taxistaColeta = taxistaColeta; }

    public Taxista getTaxistaEntrega() { return taxistaEntrega; }
    public void setTaxistaEntrega(Taxista taxistaEntrega) { this.taxistaEntrega = taxistaEntrega; }

    public Comisseiro getComisseiro() { return comisseiro; }
    public void setComisseiro(Comisseiro comisseiro) { this.comisseiro = comisseiro; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public String getMetodoPagamento() { return metodoPagamento; }
    public void setMetodoPagamento(String metodoPagamento) { this.metodoPagamento = metodoPagamento; }

    public boolean isPago() { return pago; }
    public void setPago(boolean pago) { this.pago = pago; }

    public String getCorTag() { return corTag; }
    public void setCorTag(String corTag) { this.corTag = corTag; }

    public Integer getOrdemGrid() { return ordemGrid; }
    public void setOrdemGrid(Integer ordemGrid) { this.ordemGrid = ordemGrid; }
}