package com.partricioturismo.crud.model;

import jakarta.persistence.*;

@Entity(name = "onibus")
@Table(name = "onibus")
public class Onibus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idOnibus;
    private String modelo;
    private String placa;
    private int capacidade;

    public Onibus() {
    }

    public Onibus(Integer idOnibus, String modelo, String placa, int capacidade) {
        this.idOnibus = idOnibus;
        this.modelo = modelo;
        this.placa = placa;
        this.capacidade = capacidade;
    }

    public Integer getIdOnibus() {
        return idOnibus;
    }

    public void setIdOnibus(Integer idOnibus) {
        this.idOnibus = idOnibus;
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

    public int getCapacidade() {
        return capacidade;
    }

    public void setCapacidade(int capacidade) {
        this.capacidade = capacidade;
    }
}
