package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.PassageiroViagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PassageiroViagemRepository extends JpaRepository<PassageiroViagem, Long> {

    // Método que você já tinha:
    // O Spring Data JPA cria a query "SELECT * FROM passageiro_viagem WHERE viagem_id = ?"
    List<PassageiroViagem> findByViagemId(Long viagemId);

    // --- NOVOS MÉTODOS (RELATÓRIOS - FUNCIONALIDADE 3) ---

    /**
     * Encontra todos os passageiros de uma viagem específica,
     * filtrados por um taxista específico.
     * Query: SELECT * FROM passageiro_viagem WHERE viagem_id = ? AND taxista_id = ?
     */
    List<PassageiroViagem> findByViagemIdAndTaxistaId(Long viagemId, Long taxistaId);

    /**
     * Encontra todos os passageiros de uma viagem específica,
     * filtrados por um comisseiro específico.
     * Query: SELECT * FROM passageiro_viagem WHERE viagem_id = ? AND comisseiro_id = ?
     */
    List<PassageiroViagem> findByViagemIdAndComisseiroId(Long viagemId, Long comisseiroId);
}