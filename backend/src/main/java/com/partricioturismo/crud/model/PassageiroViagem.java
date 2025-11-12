package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.Objects;
import java.util.List;

@Entity
@Table(name = "passageiro_viagem") // Nome da tabela como definido em V2
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

    // --- NOVOS CAMPOS (FUNCIONALIDADE 1) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taxista_id")
    private Taxista taxista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comisseiro_id")
    private Comisseiro comisseiro;

    // --- NOVOS CAMPOS (FUNCIONALIDADE 2) ---
    @Column(name = "valor", precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "metodo_pagamento", length = 50)
    private String metodoPagamento;

    @Column(name = "pago", nullable = false)
    private boolean pago = false; // Garante o 'DEFAULT false'

    // --- CAMPO NOVO (PASSO 2) ---
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assento_id", unique = true) // 'unique = true' é crucial
    private Assento assento;

    // Construtores
    public PassageiroViagem() {
    }

    // Getters e Setters (para todos os campos, incluindo os novos)

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

    // --- GETTERS E SETTERS (NOVOS CAMPOS) ---

    public Taxista getTaxista() {
        return taxista;
    }

    public void setTaxista(Taxista taxista) {
        this.taxista = taxista;
    }

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

    // --- GETTER E SETTER NOVOS (PASSO 2) ---
    public Assento getAssento() {
        return assento;
    }

    public void setAssento(Assento assento) {
        this.assento = assento;
    }

    // hashCode e equals
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