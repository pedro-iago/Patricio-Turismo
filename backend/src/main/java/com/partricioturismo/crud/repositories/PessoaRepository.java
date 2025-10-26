package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PessoaRepository extends JpaRepository<Pessoa, Long> {
}
