package com.partricioturismo.crud.model;

import jakarta.persistence.*;

@Entity(name = "pessoa")
@Table(name = "pessoa")
public class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Variável continua 'id'
    private String nome;
    private String cpf;
    private String telefone;
    private Integer idade;


    public Pessoa() {
    }

    // Construtor
    public Pessoa (Long id, String nome, String cpf, String telefone, Integer idade) {
        this.id = id;
        this.nome = nome;
        this.cpf = cpf;
        this.telefone = telefone;
        this.idade = idade;
    }

    public Long getId() { // Renomeado para getId()
        return id;
    }

    public void setId(Long id) { // Renomeado para setId() e parâmetro para id
        this.id = id;
    }


    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public Integer getIdade() {
        return idade;
    }

    public void setIdade(Integer idade) {
        this.idade = idade;
    }
}