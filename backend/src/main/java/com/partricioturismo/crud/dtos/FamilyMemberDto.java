package com.partricioturismo.crud.dtos;

public record FamilyMemberDto(
        Long id,          // ID do PassageiroViagem (se null, cria novo)
        Long pessoaId,    // ID da Pessoa (se null, cria nova ou busca por CPF)
        String nome,
        String telefone,
        String cpf,
        String numeroAssento
) {}