package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Comisseiro;
// --- IMPORT CORRIGIDO ---
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// --- MUDANÇA AQUI (DE VOLTA PARA JpaRepository) ---
public interface ComisseiroRepository extends JpaRepository<Comisseiro, Long> {
}