package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Taxista;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxistaRepository extends JpaRepository<Taxista, Long> {

    // Verifica se já existe um taxista vinculado a esta pessoa
    boolean existsByPessoaId(Long pessoaId);

    // Busca taxistas filtrando pelo nome da pessoa (ignorando maiúsculas/minúsculas)
    Page<Taxista> findByPessoaNomeContainingIgnoreCase(String nome, Pageable pageable);
}