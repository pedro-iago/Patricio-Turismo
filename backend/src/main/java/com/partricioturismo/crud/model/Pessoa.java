package com.partricioturismo.crud.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "pessoa")
@Table(name = "pessoa")
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String cpf;
    private Integer idade;

    // A lista nova que criamos
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "pessoa_telefones",
            joinColumns = @JoinColumn(name = "pessoa_id")
    )
    @Column(name = "telefone")
    private List<String> telefones = new ArrayList<>();

    public Pessoa() {
    }

    public Pessoa(Long id, String nome, String cpf, List<String> telefones, Integer idade) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.telefones = telefones;
        this.idade = idade;
    }

    // --- MÉTODOS DE COMPATIBILIDADE (ADICIONE ISTO) ---
    // Isso resolve o erro "cannot find symbol method getTelefone()"
    public String getTelefone() {
        if (telefones != null && !telefones.isEmpty()) {
            return telefones.get(0); // Retorna o primeiro número da lista
        }
        return null;
    }

    public void setTelefone(String telefone) {
        if (this.telefones == null) {
            this.telefones = new ArrayList<>();
        }
        if (telefone != null && !telefone.trim().isEmpty()) {
            if (!this.telefones.isEmpty()) {
                this.telefones.set(0, telefone); // Atualiza o principal
            } else {
                this.telefones.add(telefone); // Adiciona novo
            }
        }
    }
    // --------------------------------------------------

    // Getters e Setters Normais
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }

    public List<String> getTelefones() { return telefones; }
    public void setTelefones(List<String> telefones) { this.telefones = telefones; }
}