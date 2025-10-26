package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.PassageiroViagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // 1. IMPORTAR

public interface PassageiroViagemRepository extends JpaRepository<PassageiroViagem, Long> {
    // O Spring Data JPA cria a query "SELECT * FROM passageiro_viagem WHERE viagem_id = ?"
    List<PassageiroViagem> findByViagemId(Long viagemId);
}