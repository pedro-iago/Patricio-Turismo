package com.partricioturismo.crud.model;

import jakarta.persistence.*;

@Entity
@Table(name = "assento")
public class Assento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numero;

    @Column(nullable = false)
    private boolean ocupado = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viagem_id", nullable = false)
    private Viagem viagem;

    // --- NOVO CAMPO V12 ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onibus_id")
    private Onibus onibus;
    // ----------------------

    @OneToOne(mappedBy = "assento", fetch = FetchType.LAZY)
    private PassageiroViagem passageiroViagem;

    // --- Getters e Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public boolean isOcupado() { return ocupado; }
    public void setOcupado(boolean ocupado) { this.ocupado = ocupado; }

    public Viagem getViagem() { return viagem; }
    public void setViagem(Viagem viagem) { this.viagem = viagem; }

    // --- Getter e Setter do Ônibus ---
    public Onibus getOnibus() { return onibus; }
    public void setOnibus(Onibus onibus) { this.onibus = onibus; }
    // ---------------------------------

    public PassageiroViagem getPassageiroViagem() { return passageiroViagem; }
    public void setPassageiroViagem(PassageiroViagem passageiroViagem) { this.passageiroViagem = passageiroViagem; }
}