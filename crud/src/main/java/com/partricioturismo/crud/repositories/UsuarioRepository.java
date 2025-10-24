package com.partricioturismo.crud.repositories; // (Seu pacote)

import com.partricioturismo.crud.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Método para buscar um usuário pelo seu login (username)
    UserDetails findByLogin(String login);
}
