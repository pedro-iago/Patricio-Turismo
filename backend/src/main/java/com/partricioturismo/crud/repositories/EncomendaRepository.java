package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // 1. IMPORTAR

public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {
    // O Spring Data JPA cria a query "SELECT * FROM encomenda WHERE viagem_id = ?"
    List<Encomenda> findByViagemId(Long viagemId);
}