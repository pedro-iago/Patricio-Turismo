package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {
}