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

    // --- MÉTODOS EXISTENTES (ATUALIZADOS COM JOIN FETCH) ---

    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE pv.viagem.id = :viagemId")
    List<PassageiroViagem> findByViagemId(@Param("viagemId") Long viagemId);

    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE pv.viagem.id = :viagemId AND pv.taxista.id = :taxistaId")
    List<PassageiroViagem> findByViagemIdAndTaxistaId(@Param("viagemId") Long viagemId, @Param("taxistaId") Long taxistaId);

    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE pv.viagem.id = :viagemId AND pv.comisseiro.id = :comisseiroId")
    List<PassageiroViagem> findByViagemIdAndComisseiroId(@Param("viagemId") Long viagemId, @Param("comisseiroId") Long comisseiroId);

    // --- MÉTODOS DE RELATÓRIO (ATUALIZADOS COM JOIN FETCH) ---

    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE pv.taxista.id = :taxistaId AND v.dataHoraPartida BETWEEN :inicio AND :fim")
    List<PassageiroViagem> findByTaxistaIdAndViagemDataHoraPartidaBetween(
            @Param("taxistaId") Long taxistaId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.onibus " +
            "WHERE pv.comisseiro.id = :comisseiroId AND v.dataHoraPartida BETWEEN :inicio AND :fim")
    List<PassageiroViagem> findByComisseiroIdAndViagemDataHoraPartidaBetween(
            @Param("comisseiroId") Long comisseiroId,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    // --- NOVO MÉTODO PARA HISTÓRICO DA PESSOA ---
    @Query("SELECT pv FROM PassageiroViagem pv " +
            "JOIN FETCH pv.pessoa p " +
            "JOIN FETCH pv.viagem v " +
            "LEFT JOIN FETCH v.onibus o " +
            "WHERE p.id = :pessoaId ORDER BY v.dataHoraPartida DESC")
    List<PassageiroViagem> findByPessoaIdWithHistory(@Param("pessoaId") Long pessoaId);
}