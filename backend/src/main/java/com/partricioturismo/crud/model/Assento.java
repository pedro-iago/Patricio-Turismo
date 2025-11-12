package com.partricioturismo.crud.model;

import jakarta.persistence.*;
// Removidos imports de Hibernate/SqlTypes

@Entity
@Table(name = "assento")
public class Assento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numero;

    // --- MUDANÇA PRINCIPAL: De ENUM para BOOLEAN ---
    @Column(nullable = false)
    private boolean ocupado = false; // TRUE = ocupado, FALSE = livre

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    @OneToOne(mappedBy = "assento", fetch = FetchType.LAZY)
    private PassageiroViagem passageiroViagem;

    // --- Getters e Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    // --- NOVO GETTER/SETTER para BOOLEAN ---
    public boolean isOcupado() {
        return ocupado;
    }

    public void setOcupado(boolean ocupado) {
        this.ocupado = ocupado;
    }
    // --- FIM DOS GETTERS/SETTERS NOVOS ---

    public Viagem getViagem() { return viagem; }
    public void setViagem(Viagem viagem) { this.viagem = viagem; }
    public PassageiroViagem getPassageiroViagem() { return passageiroViagem; }
    public void setPassageiroViagem(PassageiroViagem passageiroViagem) { this.passageiroViagem = passageiroViagem; }
}