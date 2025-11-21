package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    Optional<Endereco> findByCep(String cep);

    // --- NOVA BUSCA ABRANGENTE ---
    // Busca por trechos em Logradouro, Bairro, Cidade OU CEP
    @Query("SELECT e FROM Endereco e WHERE " +
            "LOWER(e.logradouro) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(e.bairro) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(e.cidade) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "e.cep LIKE CONCAT('%', :query, '%')")
    List<Endereco> search(@Param("query") String query);
}