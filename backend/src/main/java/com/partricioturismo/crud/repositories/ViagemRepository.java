package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Viagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ViagemRepository extends JpaRepository<Viagem, Long> {

    /**
     * Sobrescreve o findAll(Pageable) padrão.
     * CORREÇÃO: Mudamos 'v.onibus' para 'v.listaOnibus'.
     * Usamos LEFT JOIN FETCH para trazer a viagem mesmo se não tiver ônibus vinculado ainda.
     */
    @Query(value = "SELECT v FROM Viagem v LEFT JOIN FETCH v.listaOnibus",
            countQuery = "SELECT COUNT(v) FROM Viagem v")
    Page<Viagem> findAll(Pageable pageable);
}