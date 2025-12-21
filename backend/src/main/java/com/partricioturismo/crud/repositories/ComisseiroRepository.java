package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Comisseiro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComisseiroRepository extends JpaRepository<Comisseiro, Long> {

    // Verifica se já existe um comisseiro vinculado a esta pessoa
    boolean existsByPessoaId(Long pessoaId);

    // Busca comisseiros filtrando pelo nome da pessoa
    Page<Comisseiro> findByPessoaNomeContainingIgnoreCase(String nome, Pageable pageable);
}