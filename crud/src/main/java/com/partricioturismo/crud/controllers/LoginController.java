package com.partricioturismo.crud.controllers; // (Seu pacote)

import com.partricioturismo.crud.dtos.LoginRequestDto;
import com.partricioturismo.crud.dtos.LoginResponseDto;
import com.partricioturismo.crud.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequest) {
        // Cria um objeto de autenticação com o username e password recebidos
        var usernamePassword = new UsernamePasswordAuthenticationToken(
                loginRequest.username(), loginRequest.password());

        try {
            // Tenta autenticar o usuário usando o AuthenticationManager
            // Ele vai chamar nosso UserDetailsService (que busca no UsuarioRepository)
            // e comparar a senha usando o PasswordEncoder
            Authentication auth = authenticationManager.authenticate(usernamePassword);

            // Se a autenticação foi bem-sucedida, gera o token JWT
            String token = tokenService.generateToken(auth);

            // Retorna o token em um DTO
            return ResponseEntity.ok(new LoginResponseDto(token));

        } catch (AuthenticationException e) {
            // Se a autenticação falhar (usuário/senha inválidos), retorna 401 Unauthorized
            return ResponseEntity.status(401).body("Credenciais inválidas");
        }
    }
}