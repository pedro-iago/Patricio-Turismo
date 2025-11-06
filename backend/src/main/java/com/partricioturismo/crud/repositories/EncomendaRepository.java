package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {

    // Método que você já tinha:
    // O Spring Data JPA cria a query "SELECT * FROM encomenda WHERE viagem_id = ?"
    List<Encomenda> findByViagemId(Long viagemId);

    // --- NOVOS MÉTODOS (RELATÓRIOS - FUNCIONALIDADE 3) ---

    /**
     * Encontra todas as encomendas de uma viagem específica,
     * filtradas por um taxista específico.
     * Query: SELECT * FROM encomenda WHERE viagem_id = ? AND taxista_id = ?
     */
    List<Encomenda> findByViagemIdAndTaxistaId(Long viagemId, Long taxistaId);

    /**
     * Encontra todas as encomendas de uma viagem específica,
     * filtradas por um comisseiro específico.
     * Query: SELECT * FROM encomenda WHERE viagem_id = ? AND comisseiro_id = ?
     */
    List<Encomenda> findByViagemIdAndComisseiroId(Long viagemId, Long comisseiroId);
}