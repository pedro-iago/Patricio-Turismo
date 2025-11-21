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

    /**
     * Query Inteligente para filtrar Viagens.
     * 1. DISTINCT: Evita duplicar a viagem se ela tiver múltiplos ônibus que batem com a busca.
     * 2. LEFT JOIN FETCH: Traz os ônibus juntos para performance.
     * 3. Filtros Opcionais: Se o parâmetro for NULL, o filtro é ignorado.
     */
    @Query("SELECT DISTINCT v FROM Viagem v " +
            "LEFT JOIN FETCH v.listaOnibus o " +
            "WHERE (:mes IS NULL OR FUNCTION('MONTH', v.dataHoraPartida) = :mes) " +
            "AND (:ano IS NULL OR FUNCTION('YEAR', v.dataHoraPartida) = :ano) " +
            "AND (:query IS NULL OR LOWER(o.placa) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(o.modelo) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Viagem> findAllWithFilters(
            @Param("mes") Integer mes,
            @Param("ano") Integer ano,
            @Param("query") String query,
            Pageable pageable
    );
}