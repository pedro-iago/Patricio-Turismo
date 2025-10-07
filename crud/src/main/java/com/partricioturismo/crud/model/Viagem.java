package com.partricioturismo.crud.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity(name = "viagem")
@Table(name = "viagem")
public class Viagem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idViagem;
    private LocalDate dataPartida;
    private LocalDate dataChegada;

    @ManyToOne
    @JoinColumn(name = "idOnibus")
    private Onibus onibus;

    public Viagem() {
    }

    public Viagem(Integer idViagem, LocalDate dataPartida, LocalDate dataChegada, Onibus onibus) {
        this.idViagem = idViagem;
        this.dataPartida = dataPartida;
        this.dataChegada = dataChegada;
        this.onibus = onibus;
    }

    public Integer getIdViagem() {
        return idViagem;
    }

    public void setIdViagem(Integer idViagem) {
        this.idViagem = idViagem;
    }

    public LocalDate getDataPartida() {
        return dataPartida;
    }

    public void setDataPartida(LocalDate dataPartida) {
        this.dataPartida = dataPartida;
    }

    public LocalDate getDataChegada() {
        return dataChegada;
    }

    public void setDataChegada(LocalDate dataChegada) {
        this.dataChegada = dataChegada;
    }

    public Onibus getOnibus() {
        return onibus;
    }

    public void setOnibus(Onibus onibus) {
        this.onibus = onibus;
    }
}
