package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Passageiro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassageiroRepository extends JpaRepository<Passageiro, Integer> {
}
