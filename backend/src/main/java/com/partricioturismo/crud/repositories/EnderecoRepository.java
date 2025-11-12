package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Endereco;
// --- IMPORT CORRIGIDO ---
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// --- MUDANÇA AQUI (DE VOLTA PARA JpaRepository) ---
public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    List<Endereco> findTop10ByLogradouroContainingIgnoreCaseOrCep(String logradouro, String cep);
}