package com.partricioturismo.crud.model;

import jakarta.persistence.*;

@Entity
@Table(name = "passageiro_viagem")
public class PassageiroViagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Muitas associações "PassageiroViagem" podem pertencer a UMA Pessoa
    @ManyToOne
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    // Muitas associações "PassageiroViagem" podem pertencer a UMA Viagem
    @ManyToOne
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    // Muitas associações podem usar o MESMO Endereco de coleta
    @ManyToOne
    @JoinColumn(name = "endereco_coleta_id", nullable = false)
    private Endereco enderecoColeta;

    // Muitas associações podem usar o MESMO Endereco de entrega
    @ManyToOne
    @JoinColumn(name = "endereco_entrega_id", nullable = false)
    private Endereco enderecoEntrega;

    // Construtor padrão (vazio)
    public PassageiroViagem() {
    }

    // Construtor com todos os campos
    public PassageiroViagem(Long id, Pessoa pessoa, Viagem viagem, Endereco enderecoColeta, Endereco enderecoEntrega) {
        this.id = id;
        this.pessoa = pessoa;
        this.viagem = viagem;
        this.enderecoColeta = enderecoColeta;
        this.enderecoEntrega = enderecoEntrega;
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
}