package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    // Método necessário para a nova lógica de Grupo Família
    Optional<Pessoa> findByCpf(String cpf);

    // Métodos que já existiam (mantidos para não quebrar outras partes)
    boolean existsByCpf(String cpf);

    List<Pessoa> findTop10ByNomeContainingIgnoreCaseOrCpf(String nome, String cpf);
}