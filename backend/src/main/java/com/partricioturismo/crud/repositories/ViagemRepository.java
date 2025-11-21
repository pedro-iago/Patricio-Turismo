package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Viagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ViagemRepository extends JpaRepository<Viagem, Long> {

    @Query(
            value = "SELECT DISTINCT v FROM Viagem v " +
                    "LEFT JOIN FETCH v.listaOnibus o " +
                    "WHERE (:mes IS NULL OR EXTRACT(MONTH FROM v.dataHoraPartida) = :mes) " +
                    "AND (:ano IS NULL OR EXTRACT(YEAR FROM v.dataHoraPartida) = :ano) " +
                    "AND (:query IS NULL OR LOWER(o.placa) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(o.modelo) LIKE LOWER(CONCAT('%', :query, '%')))",

            // === AQUI ESTÁ A CORREÇÃO: QUERY ESPECÍFICA PARA CONTAGEM ===
            countQuery = "SELECT COUNT(DISTINCT v) FROM Viagem v " +
                    "LEFT JOIN v.listaOnibus o " +
                    "WHERE (:mes IS NULL OR EXTRACT(MONTH FROM v.dataHoraPartida) = :mes) " +
                    "AND (:ano IS NULL OR EXTRACT(YEAR FROM v.dataHoraPartida) = :ano) " +
                    "AND (:query IS NULL OR LOWER(o.placa) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(o.modelo) LIKE LOWER(CONCAT('%', :query, '%')))"
    )
    Page<Viagem> findAllWithFilters(
            @Param("mes") Integer mes,
            @Param("ano") Integer ano,
            @Param("query") String query,
            Pageable pageable
    );
}