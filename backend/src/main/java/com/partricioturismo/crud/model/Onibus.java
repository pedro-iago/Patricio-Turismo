package com.partricioturismo.crud.model;

import jakarta.persistence.*;

@Entity(name = "onibus")
@Table(name = "onibus")
public class Onibus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "modelo")
    private String modelo;

    @Column(name = "placa")
    private String placa;

    @Column(name = "capacidade_passageiros")
    private int capacidadePassageiros;

    public Onibus() {
    }

    // Construtor
    public Onibus(Long idOnibus, String modelo, String placa, int capacidadePassageiros) {
        this.id = id;
        this.modelo = modelo;
        this.placa = placa;
        this.capacidadePassageiros = capacidadePassageiros;
    }

    // Getters e Setters
    public Long getIdOnibus() {
        return id;
    }

    public void setIdOnibus(Long idOnibus) {
        this.id = idOnibus;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public int getCapacidadePassageiros() {
        return capacidadePassageiros;
    }

    public void setCapacidadePassageiros(int capacidadePassageiros) {
        this.capacidadePassageiros = capacidadePassageiros;
    }
}