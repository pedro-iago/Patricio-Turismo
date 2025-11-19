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

    // CAMPO OBRIGATÓRIO PARA O MAPA DE ASSENTOS
    @Column(name = "layout_json", columnDefinition = "TEXT")
    private String layoutJson;

    public Onibus() {
    }

    // Construtor
    public Onibus(Long idOnibus, String modelo, String placa, int capacidadePassageiros, String layoutJson) {
        this.id = idOnibus; // Corrigido: usa o parametro idOnibus
        this.modelo = modelo;
        this.placa = placa;
        this.capacidadePassageiros = capacidadePassageiros;
        this.layoutJson = layoutJson;
    }

    // --- Getters e Setters (Mantendo seu padrão getIdOnibus) ---

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

    public String getLayoutJson() {
        return layoutJson;
    }

    public void setLayoutJson(String layoutJson) {
        this.layoutJson = layoutJson;
    }
}