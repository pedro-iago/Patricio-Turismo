package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Pessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PessoaRepository extends JpaRepository<Pessoa, Long> {

    // === CORREÇÃO: Adicione este método para o Service funcionar ===
    boolean existsByCpf(String cpf);

    // Este método já deve existir se a busca estiver funcionando
    List<Pessoa> findTop10ByNomeContainingIgnoreCaseOrCpf(String nome, String cpf);
}