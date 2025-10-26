package com.partricioturismo.crud.service; // (Seu pacote)

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

@Service
public class TokenService {

    @Autowired
    private JwtEncoder encoder;

    public String generateToken(Authentication authentication) {
        Instant now = Instant.now();
        // Define o tempo de expiração do token
        long expiry = 18000L; // Em segundos

        // Coleta as "roles" (permissões) do usuário autenticado
        String scope = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(" ")); // Separa as roles com espaço (padrão OAuth2)

        // Monta as "claims" (informações) que vão dentro do token
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self") // Emissor do token (pode ser o nome da sua API)
                .issuedAt(now) // Data e hora de emissão
                .expiresAt(now.plusSeconds(expiry)) // Data e hora de expiração
                .subject(authentication.getName()) // O "dono" do token (geralmente o username/login)
                .claim("scope", scope) // As permissões do usuário
                .build();

        // Codifica (gera) o token JWT usando as claims e a chave privada
        return this.encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}