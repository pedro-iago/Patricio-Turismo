package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List; // <-- IMPORT NOVO

@Entity
@Table(name = "viagem")
public class Viagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dataHoraPartida;

    @Column(nullable = false)
    private LocalDateTime dataHoraChegada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "onibus_id", nullable = false)
    private Onibus onibus;

    // --- CAMPO NOVO ---
    // CascadeType.ALL: Se deletar a viagem, deleta os assentos.
    @OneToMany(mappedBy = "viagem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Assento> assentos;

    // --- Getters e Setters Existentes ---
    // (Mantenha os seus getters/setters para id, dataHoraPartida, etc.)

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDataHoraPartida() {
        return dataHoraPartida;
    }

    public void setDataHoraPartida(LocalDateTime dataHoraPartida) {
        this.dataHoraPartida = dataHoraPartida;
    }

    public LocalDateTime getDataHoraChegada() {
        return dataHoraChegada;
    }

    public void setDataHoraChegada(LocalDateTime dataHoraChegada) {
        this.dataHoraChegada = dataHoraChegada;
    }

    public Onibus getOnibus() {
        return onibus;
    }

    public void setOnibus(Onibus onibus) {
        this.onibus = onibus;
    }

    // --- GETTER E SETTER NOVOS ---
    public List<Assento> getAssentos() {
        return assentos;
    }

    public void setAssentos(List<Assento> assentos) {
        this.assentos = assentos;
    }
}