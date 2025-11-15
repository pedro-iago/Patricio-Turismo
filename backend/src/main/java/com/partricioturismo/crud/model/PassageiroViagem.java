package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Objects;
import java.util.List;

@Entity
@Table(name = "passageiro_viagem")
public class PassageiroViagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    @ManyToOne(optional = false)
    @JoinColumn(name = "endereco_coleta_id", nullable = false)
    private Endereco enderecoColeta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "endereco_entrega_id", nullable = false)
    private Endereco enderecoEntrega;

    @OneToMany(mappedBy = "passageiroViagem")
    private List<Bagagem> bagagens;

    // --- MUDANÇA: CAMPO 'taxista' REMOVIDO ---
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "taxista_id")
    // private Taxista taxista;

    // --- MUDANÇA: NOVOS CAMPOS DE TAXISTA ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxista_coleta_id") // Esta coluna será criada na sua próxima migração
    private Taxista taxistaColeta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxista_entrega_id") // Esta coluna será criada na sua próxima migração
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assento_id", unique = true)
    private Assento assento;

    // Construtores
    public PassageiroViagem() {
    }

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pessoa getPessoa() {
        return pessoa;
    }

    public void setPessoa(Pessoa pessoa) {
        this.pessoa = pessoa;
    }

    public Viagem getViagem() {
        return viagem;
    }

    public void setViagem(Viagem viagem) {
        this.viagem = viagem;
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

    public List<Bagagem> getBagagens() {
        return bagagens;
    }

    public void setBagagens(List<Bagagem> bagagens) {
        this.bagagens = bagagens;
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

    public Assento getAssento() {
        return assento;
    }

    public void setAssento(Assento assento) {
        this.assento = assento;
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
        PassageiroViagem that = (PassageiroViagem) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}