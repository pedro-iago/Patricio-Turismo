package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Assento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssentoRepository extends JpaRepository<Assento, Long> {

    /**
     * Busca todos os assentos de uma viagem específica,
     * ordenados pelo número do assento (ex: 1, 2, 3...).
     */
    List<Assento> findByViagemIdOrderByNumero(Long viagemId);
}