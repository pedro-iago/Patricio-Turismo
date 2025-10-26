package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Encomenda")
public class Encomenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String descricao;

    @Column(precision = 10, scale = 2) // Para DECIMAL(10, 2)
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
    @JoinColumn(name = "endereco_coleta_id", nullable = false)
    private Endereco enderecoColeta;

    @ManyToOne
    @JoinColumn(name = "endereco_entrega_id", nullable = false)
    private Endereco enderecoEntrega;

    @ManyToOne
    @JoinColumn(name = "responsavel_id", nullable = true) // Pode ser nulo
    private Pessoa responsavel;

    // Construtor padrão
    public Encomenda() {
    }

    // Construtor
    public Encomenda(String descricao, BigDecimal peso, Viagem viagem, Pessoa remetente, Pessoa destinatario, Endereco enderecoColeta, Endereco enderecoEntrega, Pessoa responsavel) {
        this.descricao = descricao;
        this.peso = peso;
        this.viagem = viagem;
        this.remetente = remetente;
        this.destinatario = destinatario;
        this.enderecoColeta = enderecoColeta;
        this.enderecoEntrega = enderecoEntrega;
        this.responsavel = responsavel;
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
}