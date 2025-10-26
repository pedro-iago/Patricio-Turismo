package com.partricioturismo.crud.model; // (Confira seu pacote)

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Bagagem")
public class Bagagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(precision = 10, scale = 2) // Para DECIMAL(10, 2)
    private BigDecimal peso;

    @Column(length = 255)
    private String descricao;

    @ManyToOne
    @JoinColumn(name = "passageiro_viagem_id", nullable = true) // Pode ser nulo
    private PassageiroViagem passageiroViagem;

    @ManyToOne
    @JoinColumn(name = "responsavel_id", nullable = false) // Obrigatório
    private Pessoa responsavel;

    // Construtor padrão
    public Bagagem() {
    }

    // Construtor com campos
    public Bagagem(Long id, BigDecimal peso, String descricao, PassageiroViagem passageiroViagem, Pessoa responsavel) {
        this.id = id;
        this.peso = peso;
        this.descricao = descricao;
        this.passageiroViagem = passageiroViagem;
        this.responsavel = responsavel;
    }

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getPeso() {
        return peso;
    }

    public void setPeso(BigDecimal peso) {
        this.peso = peso;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public PassageiroViagem getPassageiroViagem() {
        return passageiroViagem;
    }

    public void setPassageiroViagem(PassageiroViagem passageiroViagem) {
        this.passageiroViagem = passageiroViagem;
    }

    public Pessoa getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(Pessoa responsavel) {
        this.responsavel = responsavel;
    }
}