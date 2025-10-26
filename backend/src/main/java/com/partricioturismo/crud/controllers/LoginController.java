package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.LoginRequestDto;
import com.partricioturismo.crud.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
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
        var usernamePassword = new UsernamePasswordAuthenticationToken(
                loginRequest.username(), loginRequest.password());

        try {
            Authentication auth = authenticationManager.authenticate(usernamePassword);
            String token = tokenService.generateToken(auth);

            ResponseCookie cookie = ResponseCookie.from("authToken", token)
                    .httpOnly(true)
                    .secure(true) // <-- OBRIGATÓRIO para HTTPS no Render
                    .path("/")
                    .maxAge(24 * 60 * 60)
                    .sameSite("Strict")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(auth.getName()); // Retorna o username

        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Credenciais inválidas");
        }
    }

    // O método "me" continua essencial para o refresh da página
    @GetMapping("/api/me")
    public ResponseEntity<String> getUsuarioLogado(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return ResponseEntity.ok(authentication.getName());
        }
        return ResponseEntity.status(401).build();
    }
}