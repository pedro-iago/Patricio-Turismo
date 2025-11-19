package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Assento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssentoRepository extends JpaRepository<Assento, Long> {

    /**
     * Busca todos os assentos de uma viagem específica,
     * ordenados pelo número do assento.
     */
    List<Assento> findByViagemIdOrderByNumero(Long viagemId);

    /**
     * Busca um assento específico pelo número, dentro de um ônibus específico de uma viagem.
     * Usado para vincular passageiros pelo mapa visual.
     */
    Optional<Assento> findByViagemIdAndOnibusIdAndNumero(Long viagemId, Long onibusId, String numero);
}