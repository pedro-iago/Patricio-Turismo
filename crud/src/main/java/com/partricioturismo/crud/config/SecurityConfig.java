package com.partricioturismo.crud.config; // (Seu pacote)

import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.partricioturismo.crud.repositories.UsuarioRepository; // Importe seu repositório
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // Para liberar o POST /login
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy; // Para stateless
import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.security.core.userdetails.UsernameNotFoundException; // Não necessário aqui
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration; // <-- IMPORT ADICIONADO
import org.springframework.web.cors.CorsConfigurationSource; // <-- IMPORT ADICIONADO
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // <-- IMPORT ADICIONADO

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List; // <-- IMPORT ADICIONADO

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Injeta as chaves RSA lidas do application.properties (via arquivos .pem)
    @Value("${jwt.public.key}")
    RSAPublicKey publicKey;

    @Value("${jwt.private.key}")
    RSAPrivateKey privateKey;

    // 1. Define o "criptografador" de senhas
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Define como buscar o usuário no banco de dados (usa o UsuarioRepository)
    @Bean
    public UserDetailsService userDetailsService(UsuarioRepository usuarioRepository) {
        return username -> usuarioRepository.findByLogin(username);
        // O findByLogin já retorna UserDetails, não precisamos do orElseThrow aqui
    }

    // 3. Expõe o AuthenticationManager (necessário para o endpoint de login)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // 4. Configura o filtro de segurança principal
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/login").permitAll() // Libera o endpoint de login
                        // Adicione outras rotas públicas aqui se precisar (ex: /public/**)
                        .anyRequest().authenticated() // Exige autenticação para qualquer outra rota
                )
                .csrf(csrf -> csrf.disable()) // Desabilita CSRF
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Sessão sem estado (JWT)
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults())) // Habilita validação de JWT
                .cors(Customizer.withDefaults()); // <-- ADICIONADO PARA HABILITAR CORS

        return http.build();
    }

    // --- Beans para codificar/decodificar JWT com as chaves RSA ---

    @Bean
    JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withPublicKey(this.publicKey).build();
    }

    @Bean
    JwtEncoder jwtEncoder() {
        JWK jwk = new RSAKey.Builder(this.publicKey).privateKey(this.privateKey).build();
        JWKSource<SecurityContext> jwks = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwks);
    }

    // --- BEAN ADICIONADO PARA CONFIGURAR O CORS ---
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Permite requisições EXATAMENTE desta origem (seu frontend React)
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        // Permite os métodos HTTP mais comuns
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Permite cabeçalhos comuns, incluindo Authorization para o JWT
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        // Permite que o navegador envie credenciais (necessário em alguns casos, embora não para JWT simples)
        // configuration.setAllowCredentials(true); // Descomente se necessário

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Aplica esta configuração a TODAS as rotas da sua API ("/**")
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
