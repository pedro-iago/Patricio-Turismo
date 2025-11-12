package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // <-- IMPORT NOVO
import org.springframework.data.repository.query.Param; // <-- IMPORT NOVO
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {

    // --- MÉTODOS EXISTENTES (ATUALIZADOS COM JOIN FETCH) ---
    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE e.viagem.id = :viagemId")
    List<Encomenda> findByViagemId(@Param("viagemId") Long viagemId);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE e.viagem.id = :viagemId AND e.taxista.id = :taxistaId")
    List<Encomenda> findByViagemIdAndTaxistaId(@Param("viagemId") Long viagemId, @Param("taxistaId") Long taxistaId);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE e.viagem.id = :viagemId AND e.comisseiro.id = :comisseiroId")
    List<Encomenda> findByViagemIdAndComisseiroId(@Param("viagemId") Long viagemId, @Param("comisseiroId") Long comisseiroId);

    // --- MÉTODOS DE RELATÓRIO (ATUALIZADOS COM JOIN FETCH) ---

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE e.taxista.id = :taxistaId AND v.dataHoraPartida BETWEEN :inicio AND :fim")
    List<Encomenda> findByTaxistaIdAndViagemDataHoraPartidaBetween(
            @Param("taxistaId") Long taxistaId,
            @Param("inicio") LocalDateTime dataInicio,
            @Param("fim") LocalDateTime dataFim);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE e.comisseiro.id = :comisseiroId AND v.dataHoraPartida BETWEEN :inicio AND :fim")
    List<Encomenda> findByComisseiroIdAndViagemDataHoraPartidaBetween(
            @Param("comisseiroId") Long comisseiroId,
            @Param("inicio") LocalDateTime dataInicio,
            @Param("fim") LocalDateTime dataFim);

    // --- NOVOS MÉTODOS PARA HISTÓRICO DA PESSOA ---

    // Para encomendas ENVIADAS pela pessoa
    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus o " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "WHERE e.remetente.id = :pessoaId ORDER BY v.dataHoraPartida DESC")
    List<Encomenda> findByRemetenteIdWithHistory(@Param("pessoaId") Long pessoaId);

    // Para encomendas RECEBIDAS pela pessoa
    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.onibus o " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "WHERE e.destinatario.id = :pessoaId ORDER BY v.dataHoraPartida DESC")
    List<Encomenda> findByDestinatarioIdWithHistory(@Param("pessoaId") Long pessoaId);
}