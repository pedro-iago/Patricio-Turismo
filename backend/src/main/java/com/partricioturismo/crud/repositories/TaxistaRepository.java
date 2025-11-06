package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Taxista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxistaRepository extends JpaRepository<Taxista, Long> {
}