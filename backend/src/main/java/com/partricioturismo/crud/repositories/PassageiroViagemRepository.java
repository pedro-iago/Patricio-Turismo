package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.PassageiroViagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PassageiroViagemRepository extends JpaRepository<PassageiroViagem, Long> {

    // --- MÉTODOS ORIGINAIS / GERAIS ---

    @Query("SELECT DISTINCT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " +
            "LEFT JOIN FETCH pv.taxistaColeta " +
            "LEFT JOIN FETCH pv.taxistaEntrega " +
            "LEFT JOIN FETCH pv.comisseiro " +
            "WHERE pv.viagem.id = :viagemId " +
            "ORDER BY pv.ordem ASC, pv.id ASC")
    List<PassageiroViagem> findByViagemId(@Param("viagemId") Long viagemId);

    // --- MÉTODOS USADOS PELO ReportController (CORREÇÃO DOS ERROS) ---

    // 1. Busca passageiros de uma viagem filtrados por Taxista (Coleta OU Entrega)
    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "WHERE pv.viagem.id = :viagemId " +
            "AND (pv.taxistaColeta.id = :taxistaId OR pv.taxistaEntrega.id = :taxistaId)")
    List<PassageiroViagem> findByViagemIdAndTaxistaId(@Param("viagemId") Long viagemId, @Param("taxistaId") Long taxistaId);

    // 2. Busca passageiros de uma viagem filtrados por Comisseiro
    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "WHERE pv.viagem.id = :viagemId AND pv.comisseiro.id = :comisseiroId")
    List<PassageiroViagem> findByViagemIdAndComisseiroId(@Param("viagemId") Long viagemId, @Param("comisseiroId") Long comisseiroId);

    // 3. Histórico Taxista (Usado pelo ReportController - Nome Antigo)
    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " +
            "LEFT JOIN FETCH pv.taxistaColeta " +
            "LEFT JOIN FETCH pv.taxistaEntrega " +
            "WHERE (pv.taxistaColeta.id = :taxistaId OR pv.taxistaEntrega.id = :taxistaId) " +
            "AND v.dataHoraPartida BETWEEN :inicio AND :fim " +
            "ORDER BY v.dataHoraPartida DESC")
    List<PassageiroViagem> findByTaxistaIdAndViagemDataHoraPartidaBetween(
            @Param("taxistaId") Long taxistaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    // 4. Histórico Comisseiro (Usado pelo ReportController)
    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " +
            "WHERE pv.comisseiro.id = :comisseiroId AND v.dataHoraPartida BETWEEN :inicio AND :fim " +
            "ORDER BY v.dataHoraPartida DESC")
    List<PassageiroViagem> findByComisseiroIdAndViagemDataHoraPartidaBetween(
            @Param("comisseiroId") Long comisseiroId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    // --- MÉTODOS USADOS PELO PassageiroViagemService (NOVO SISTEMA) ---

    // Histórico Taxista (Nome Novo - Redireciona para a mesma query lógica se preferir, ou duplicamos a query)
    // Para evitar confusão, implementamos com a mesma query do ReportController acima
    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " +
            "LEFT JOIN FETCH pv.taxistaColeta " +
            "LEFT JOIN FETCH pv.taxistaEntrega " +
            "WHERE (pv.taxistaColeta.id = :taxistaId OR pv.taxistaEntrega.id = :taxistaId) " +
            "AND v.dataHoraPartida BETWEEN :inicio AND :fim " +
            "ORDER BY v.dataHoraPartida DESC")
    List<PassageiroViagem> findByTaxistaIdAndDateRange(
            @Param("taxistaId") Long taxistaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    // --- MÉTODOS DE HISTÓRICO DE PESSOA ---

    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa p " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.listaOnibus " +
            "WHERE p.id = :pessoaId ORDER BY v.dataHoraPartida DESC")
    List<PassageiroViagem> findByPessoaIdWithHistory(@Param("pessoaId") Long pessoaId);

    // Helpers de Ordem
    @Query("SELECT MIN(pv.ordem) FROM PassageiroViagem pv WHERE pv.viagem.id = :viagemId")
    Integer findMinOrdemByViagemId(@Param("viagemId") Long viagemId);

    @Query("SELECT MAX(pv.ordem) FROM PassageiroViagem pv WHERE pv.viagem.id = :viagemId")
    Integer findMaxOrdemByViagemId(@Param("viagemId") Long viagemId);
}