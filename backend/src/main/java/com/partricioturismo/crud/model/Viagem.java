package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // --- MUDANÇA: Agora é uma Lista de Ônibus (ManyToMany) ---
    @ManyToMany
    @JoinTable(
            name = "viagem_onibus",
            joinColumns = @JoinColumn(name = "viagem_id"),
            inverseJoinColumns = @JoinColumn(name = "onibus_id")
    )
    private List<Onibus> listaOnibus = new ArrayList<>();

    @OneToMany(mappedBy = "viagem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Assento> assentos;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDataHoraPartida() { return dataHoraPartida; }
    public void setDataHoraPartida(LocalDateTime dataHoraPartida) { this.dataHoraPartida = dataHoraPartida; }

    public LocalDateTime getDataHoraChegada() { return dataHoraChegada; }
    public void setDataHoraChegada(LocalDateTime dataHoraChegada) { this.dataHoraChegada = dataHoraChegada; }

    // --- GETTER E SETTER DA LISTA ---
    public List<Onibus> getListaOnibus() { return listaOnibus; }
    public void setListaOnibus(List<Onibus> listaOnibus) { this.listaOnibus = listaOnibus; }

    public List<Assento> getAssentos() { return assentos; }
    public void setAssentos(List<Assento> assentos) { this.assentos = assentos; }

    // =================================================================
    // MÉTODOS DE COMPATIBILIDADE (LEGACY)
    // Adicionados para não quebrar códigos antigos que chamam .getOnibus()
    // =================================================================

    /**
     * Retorna o primeiro ônibus da lista para manter compatibilidade.
     */
    public Onibus getOnibus() {
        if (this.listaOnibus != null && !this.listaOnibus.isEmpty()) {
            return this.listaOnibus.get(0);
        }
        return null;
    }

    /**
     * Define um único ônibus (substitui a lista inteira por este único).
     */
    public void setOnibus(Onibus onibus) {
        this.listaOnibus = new ArrayList<>();
        if (onibus != null) {
            this.listaOnibus.add(onibus);
        }
    }
}