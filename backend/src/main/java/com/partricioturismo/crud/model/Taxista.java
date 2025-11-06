package com.partricioturismo.crud.model;

import com.partricioturismo.crud.model.Pessoa;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "taxista")
public class Taxista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    // Construtores
    public Taxista() {
    }

    public Taxista(Pessoa pessoa) {
        this.pessoa = pessoa;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Pessoa getPessoa() {
        return pessoa;
    }

    public void setPessoa(Pessoa pessoa) {
        this.pessoa = pessoa;
    }

    // hashCode e equals
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Taxista taxista = (Taxista) o;
        return Objects.equals(id, taxista.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}