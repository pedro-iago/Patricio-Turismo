package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Bagagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // 1. IMPORTAR

public interface BagagemRepository extends JpaRepository<Bagagem, Long> {
    // Query: "SELECT * FROM bagagem WHERE passageiro_viagem_id = ?"
    List<Bagagem> findByPassageiroViagemId(Long passageiroViagemId);
}