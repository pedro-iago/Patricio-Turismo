package com.partricioturismo.crud.dtos;

public class AffiliateDto {
    private Long id;
    private PessoaDto pessoa;

    // Construtores
    public AffiliateDto() {
    }

    public AffiliateDto(Long id, PessoaDto pessoa) {
        this.id = id;
        this.pessoa = pessoa;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PessoaDto getPessoa() {
        return pessoa;
    }

    public void setPessoa(PessoaDto pessoa) {
        this.pessoa = pessoa;
    }
}