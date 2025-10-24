package com.partricioturismo.crud.dtos;

// DTO para receber o login e senha na requisição
public record LoginRequestDto(String username, String password) {
}