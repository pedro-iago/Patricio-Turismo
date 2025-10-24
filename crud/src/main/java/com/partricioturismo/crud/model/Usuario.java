package com.partricioturismo.crud.model; // (Seu pacote)

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.ArrayList; // Import ArrayList

@Entity
@Table(name = "usuarios") // Nome da tabela no banco
public class Usuario implements UserDetails { // Implementa UserDetails do Spring Security

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String login;

    @Column(nullable = false)
    private String senha;

    @Column(nullable = false)
    private String roles; // Ex: "ROLE_ADMIN,ROLE_USER" ou apenas "ROLE_USER"

    // Construtor padrão
    public Usuario() {
    }

    // Construtor com todos os campos
    public Usuario(Long id, String login, String senha, String roles) {
        this.id = id;
        this.login = login;
        this.senha = senha;
        this.roles = roles;
    }

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public String getRoles() {
        return roles;
    }

    public void setRoles(String roles) {
        this.roles = roles;
    }


    // --- Métodos do UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Converte a string de roles em uma lista de permissões
        String[] roleArray = roles.split(",");
        List<SimpleGrantedAuthority> authorities = new ArrayList<>(); // Use ArrayList
        for (String role : roleArray) {
            authorities.add(new SimpleGrantedAuthority(role.trim()));
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return this.senha;
    }

    @Override
    public String getUsername() {
        return this.login;
    }

    // Métodos de controle de conta (podemos deixar como true por enquanto)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}