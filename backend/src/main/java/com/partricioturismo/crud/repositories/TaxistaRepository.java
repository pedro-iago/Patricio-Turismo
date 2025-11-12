package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Taxista;
// --- IMPORT CORRIGIDO ---
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// --- MUDANÇA AQUI (DE VOLTA PARA JpaRepository) ---
public interface TaxistaRepository extends JpaRepository<Taxista, Long> {
}