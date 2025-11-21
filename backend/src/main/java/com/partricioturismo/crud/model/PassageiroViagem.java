package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "passageiro_viagem")
public class PassageiroViagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

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

    @OneToOne
    @JoinColumn(name = "assento_id")
    private Assento assento;

    @Column(name = "cor_tag")
    private String corTag;

    // --- COLUNA DE ORDEM ---
    @Column(name = "ordem")
    private Integer ordem = 0;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Pessoa getPessoa() { return pessoa; }
    public void setPessoa(Pessoa pessoa) { this.pessoa = pessoa; }
    public Viagem getViagem() { return viagem; }
    public void setViagem(Viagem viagem) { this.viagem = viagem; }
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
    public Assento getAssento() { return assento; }
    public void setAssento(Assento assento) { this.assento = assento; }
    public String getCorTag() { return corTag; }
    public void setCorTag(String corTag) { this.corTag = corTag; }

    public Integer getOrdem() { return ordem; }
    public void setOrdem(Integer ordem) { this.ordem = ordem; }
}