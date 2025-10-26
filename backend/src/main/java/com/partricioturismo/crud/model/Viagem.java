package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Viagem")
public class Viagem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora_partida", nullable = false)
    private LocalDateTime dataHoraPartida;

    @Column(name = "data_hora_chegada", nullable = false)
    private LocalDateTime dataHoraChegada;

    @ManyToOne
    @JoinColumn(name = "onibus_id", nullable = false)
    private Onibus onibus;


    public Viagem() {
    }

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
}