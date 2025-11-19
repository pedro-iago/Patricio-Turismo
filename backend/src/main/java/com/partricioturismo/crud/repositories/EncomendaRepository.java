package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Encomenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EncomendaRepository extends JpaRepository<Encomenda, Long> {

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " + // <-- MUDOU AQUI
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE e.viagem.id = :viagemId")
    List<Encomenda> findByViagemId(@Param("viagemId") Long viagemId);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " + // <-- MUDOU AQUI
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE e.viagem.id = :viagemId " +
            "AND (e.taxistaColeta.id = :taxistaId OR e.taxistaEntrega.id = :taxistaId)")
    List<Encomenda> findByViagemIdAndTaxistaId(@Param("viagemId") Long viagemId, @Param("taxistaId") Long taxistaId);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " + // <-- MUDOU AQUI
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE e.viagem.id = :viagemId AND e.comisseiro.id = :comisseiroId")
    List<Encomenda> findByViagemIdAndComisseiroId(@Param("viagemId") Long viagemId, @Param("comisseiroId") Long comisseiroId);

    // --- RELATÓRIOS ---

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " + // <-- MUDOU AQUI
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE (e.taxistaColeta.id = :taxistaId OR e.taxistaEntrega.id = :taxistaId) " +
            "AND v.dataHoraPartida BETWEEN :inicio AND :fim")
    List<Encomenda> findByTaxistaIdAndViagemDataHoraPartidaBetween(
            @Param("taxistaId") Long taxistaId,
            @Param("inicio") LocalDateTime dataInicio,
            @Param("fim") LocalDateTime dataFim);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " + // <-- MUDOU AQUI
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE e.comisseiro.id = :comisseiroId AND v.dataHoraPartida BETWEEN :inicio AND :fim")
    List<Encomenda> findByComisseiroIdAndViagemDataHoraPartidaBetween(
            @Param("comisseiroId") Long comisseiroId,
            @Param("inicio") LocalDateTime dataInicio,
            @Param("fim") LocalDateTime dataFim);

    // --- HISTÓRICO ---

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus o " + // <-- MUDOU AQUI
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE e.remetente.id = :pessoaId ORDER BY v.dataHoraPartida DESC")
    List<Encomenda> findByRemetenteIdWithHistory(@Param("pessoaId") Long pessoaId);

    @Query("SELECT e FROM Encomenda e " +
            "JOIN FETCH e.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus o " + // <-- MUDOU AQUI
            "JOIN FETCH e.remetente " +
            "JOIN FETCH e.destinatario " +
            "LEFT JOIN FETCH e.taxistaColeta " +
            "LEFT JOIN FETCH e.taxistaEntrega " +
            "LEFT JOIN FETCH e.comisseiro " +
            "WHERE e.destinatario.id = :pessoaId ORDER BY v.dataHoraPartida DESC")
    List<Encomenda> findByDestinatarioIdWithHistory(@Param("pessoaId") Long pessoaId);
}