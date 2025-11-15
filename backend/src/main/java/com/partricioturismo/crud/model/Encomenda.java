package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "encomenda")
public class Encomenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "peso", precision = 10, scale = 2)
    private BigDecimal peso;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    @ManyToOne(optional = false)
    @JoinColumn(name = "remetente_id", nullable = false)
    private Pessoa remetente;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Pessoa destinatario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "endereco_coleta_id", nullable = false)
    private Endereco enderecoColeta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "endereco_entrega_id", nullable = false)
    private Endereco enderecoEntrega;

    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    private Pessoa responsavel;

    // --- MUDANÇA: CAMPO 'taxista' REMOVIDO ---
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "taxista_id")
    // private Taxista taxista;

    // --- MUDANÇA: NOVOS CAMPOS DE TAXISTA ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxista_coleta_id") // Esta coluna será criada próxima migração
    private Taxista taxistaColeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxista_entrega_id") // Esta coluna será criada próxima migração
    private Taxista taxistaEntrega;
    // --- FIM DA MUDANÇA ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comisseiro_id")
    private Comisseiro comisseiro;

    @Column(name = "valor", precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "metodo_pagamento", length = 50)
    private String metodoPagamento;

    @Column(name = "pago", nullable = false)
    private boolean pago = false;

    // Construtores
    public Encomenda() {
    }

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public BigDecimal getPeso() {
        return peso;
    }

    public void setPeso(BigDecimal peso) {
        this.peso = peso;
    }

    public Viagem getViagem() {
        return viagem;
    }

    public void setViagem(Viagem viagem) {
        this.viagem = viagem;
    }

    public Pessoa getRemetente() {
        return remetente;
    }

    public void setRemetente(Pessoa remetente) {
        this.remetente = remetente;
    }

    public Pessoa getDestinatario() {
        return destinatario;
    }

    public void setDestinatario(Pessoa destinatario) {
        this.destinatario = destinatario;
    }

    public Endereco getEnderecoColeta() {
        return enderecoColeta;
    }

    public void setEnderecoColeta(Endereco enderecoColeta) {
        this.enderecoColeta = enderecoColeta;
    }

    public Endereco getEnderecoEntrega() {
        return enderecoEntrega;
    }

    public void setEnderecoEntrega(Endereco enderecoEntrega) {
        this.enderecoEntrega = enderecoEntrega;
    }

    public Pessoa getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(Pessoa responsavel) {
        this.responsavel = responsavel;
    }

    // --- MUDANÇA: Getter/Setter de 'taxista' removido ---

    public Comisseiro getComisseiro() {
        return comisseiro;
    }

    public void setComisseiro(Comisseiro comisseiro) {
        this.comisseiro = comisseiro;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public String getMetodoPagamento() {
        return metodoPagamento;
    }

    public void setMetodoPagamento(String metodoPagamento) {
        this.metodoPagamento = metodoPagamento;
    }

    public boolean isPago() {
        return pago;
    }

    public void setPago(boolean pago) {
        this.pago = pago;
    }

    // --- MUDANÇA: NOVOS GETTERS E SETTERS ---
    public Taxista getTaxistaColeta() {
        return taxistaColeta;
    }

    public void setTaxistaColeta(Taxista taxistaColeta) {
        this.taxistaColeta = taxistaColeta;
    }

    public Taxista getTaxistaEntrega() {
        return taxistaEntrega;
    }

    public void setTaxistaEntrega(Taxista taxistaEntrega) {
        this.taxistaEntrega = taxistaEntrega;
    }
    // --- FIM DA MUDANÇA ---

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Encomenda encomenda = (Encomenda) o;
        return Objects.equals(id, encomenda.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}