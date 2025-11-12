package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Onibus;
import org.springframework.data.jpa.repository.JpaRepository; // <-- MUDANÇA
import org.springframework.stereotype.Repository;

@Repository
// --- MUDANÇA AQUI (DE VOLTA PARA JpaRepository) ---
public interface OnibusRepository extends JpaRepository<Onibus, Long> {
}