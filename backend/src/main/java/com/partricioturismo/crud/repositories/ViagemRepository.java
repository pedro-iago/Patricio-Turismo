package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Viagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // <--- IMPORTANTE
import org.springframework.stereotype.Repository;

@Repository
public interface ViagemRepository extends JpaRepository<Viagem, Long>, JpaSpecificationExecutor<Viagem> {
    // A query gigante SUMIU.
    // O "JpaSpecificationExecutor" nos dá superpoderes de filtro nativamente.
}