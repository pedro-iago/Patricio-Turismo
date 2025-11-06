package com.partricioturismo.crud.repositories;

import com.partricioturismo.crud.model.Comisseiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComisseiroRepository extends JpaRepository<Comisseiro, Long> {
}