package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {
}