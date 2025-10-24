package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Bagagem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BagagemRepository extends JpaRepository<Bagagem, Long> {
}