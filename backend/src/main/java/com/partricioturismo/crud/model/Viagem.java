package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Formula; // <--- IMPORTANTE
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

    @ManyToMany
    @JoinTable(
            name = "viagem_onibus",
            joinColumns = @JoinColumn(name = "viagem_id"),
            inverseJoinColumns = @JoinColumn(name = "onibus_id")
    )
    private List<Onibus> listaOnibus = new ArrayList<>();

    @OneToMany(mappedBy = "viagem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Assento> assentos;

    // === NOVOS CAMPOS CALCULADOS (Fórmulas) ===
    // O Hibernate executa esse SQL automaticamente ao buscar a viagem.
    // Isso evita carregar a lista inteira de passageiros na memória.

    @Formula("(select count(*) from passageiro_viagem pv where pv.viagem_id = id)")
    private Integer totalPassageiros;

    @Formula("(select count(*) from encomenda e where e.viagem_id = id)")
    private Integer totalEncomendas;
    // ==========================================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDataHoraPartida() { return dataHoraPartida; }
    public void setDataHoraPartida(LocalDateTime dataHoraPartida) { this.dataHoraPartida = dataHoraPartida; }

    public LocalDateTime getDataHoraChegada() { return dataHoraChegada; }
    public void setDataHoraChegada(LocalDateTime dataHoraChegada) { this.dataHoraChegada = dataHoraChegada; }

    public List<Onibus> getListaOnibus() { return listaOnibus; }
    public void setListaOnibus(List<Onibus> listaOnibus) { this.listaOnibus = listaOnibus; }

    public List<Assento> getAssentos() { return assentos; }
    public void setAssentos(List<Assento> assentos) { this.assentos = assentos; }

    // === GETTERS DOS TOTAIS ===
    // Retorna 0 se for null para evitar NullPointerException no front
    public Integer getTotalPassageiros() { return totalPassageiros != null ? totalPassageiros : 0; }
    public Integer getTotalEncomendas() { return totalEncomendas != null ? totalEncomendas : 0; }

    // Métodos Legacy (Compatibilidade)
    public Onibus getOnibus() {
        if (this.listaOnibus != null && !this.listaOnibus.isEmpty()) {
            return this.listaOnibus.get(0);
        }
        return null;
    }

    public void setOnibus(Onibus onibus) {
        this.listaOnibus = new ArrayList<>();
        if (onibus != null) {
            this.listaOnibus.add(onibus);
        }
    }
}