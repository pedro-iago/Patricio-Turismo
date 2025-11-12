package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Viagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// --- IMPORTS NOVOS ---
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
// --- FIM IMPORTS NOVOS ---

@Repository
public interface ViagemRepository extends JpaRepository<Viagem, Long> {

    // --- MÉTODO NOVO (Otimização N+1) ---
    /**
     * Sobrescreve o findAll(Pageable) padrão.
     * O "JOIN FETCH v.onibus" diz ao Hibernate para buscar o ônibus (onibus)
     * na MESMA query da viagem, resolvendo o problema N+1.
     *
     * O 'countQuery' é necessário para a paginação funcionar corretamente com o JOIN FETCH.
     */
    @Query(value = "SELECT v FROM Viagem v JOIN FETCH v.onibus",
            countQuery = "SELECT COUNT(v) FROM Viagem v")
    Page<Viagem> findAll(Pageable pageable);
}