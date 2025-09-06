package com.partricioturismo.crud.model;

import jakarta.persistence.*;

@Entity(name = "passageiro")
@Table(name = "passageiro")
public class Passageiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPassageiro;
    private String nome;
    private String cpf;
    private String telefone;
    private String endereco;

    public Passageiro() {
    }

    public Passageiro(Integer id, String nome, String cpf, String telefone, String endereco) {
        this.idPassageiro = id;
        this.nome = nome;
        this.cpf = cpf;
        this.telefone = telefone;
        this.endereco = endereco;
    }

    public Integer getId() {
        return idPassageiro;
    }

    public void setId(Integer id) {
        this.idPassageiro = id;
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

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }
}
