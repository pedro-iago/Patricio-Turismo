package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Pessoa;
// --- IMPORT CORRIGIDO ---
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// --- MUDANÇA AQUI (DE VOLTA PARA JpaRepository) ---
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    List<Pessoa> findTop10ByNomeContainingIgnoreCaseOrCpf(String nome, String cpf);
}