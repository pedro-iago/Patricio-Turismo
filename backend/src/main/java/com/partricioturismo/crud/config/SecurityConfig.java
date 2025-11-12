package com.partricioturismo.crud.config;

import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.partricioturismo.crud.repositories.UsuarioRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // CORREÇÃO: Usa o nome completo da propriedade que está no application.properties
    @Value("${spring.security.oauth2.resourceserver.jwt.public.key}")
    RSAPublicKey publicKey;

    // Chave privada (agora definida no application.properties)
    @Value("${jwt.private.key}")
    RSAPrivateKey privateKey;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Bean
    public UserDetailsService userDetailsService(UsuarioRepository usuarioRepository) {
        return username -> usuarioRepository.findByLogin(username);
    }
    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withPublicKey(this.publicKey).build();
    }
    @Bean
    public JwtEncoder jwtEncoder() {
        JWK jwk = new RSAKey.Builder(this.publicKey).privateKey(this.privateKey).build();
        JWKSource<SecurityContext> jwks = new ImmutableJWKSet<>(new JWKSet(jwk));
        return new NimbusJwtEncoder(jwks);
    }
    @Bean
    public CookieAuthenticationFilter cookieAuthenticationFilter(JwtDecoder jwtDecoder, UserDetailsService userDetailsService) {
        return new CookieAuthenticationFilter(jwtDecoder, userDetailsService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CookieAuthenticationFilter cookieAuthenticationFilter) throws Exception {
        http
                .authorizeHttpRequests(authorize -> authorize
                        // ... (regras de /login, /assets, etc. continuam iguais) ...
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .requestMatchers(
                                "/", "/index.html", "/assets/**",
                                "/*.png", "/*.ico", "/*.svg"
                        ).permitAll()
                        .requestMatchers(
                                "/{path:[^\\.]*}",
                                "/**/{path:(?!api|assets)[^\\.]*}"
                        ).permitAll()

                        // --- REGRAS ESPECÍFICAS DA API ---

                        // <<< MUDANÇA AQUI
                        // Exige que o usuário tenha (pelo menos) a role "USER" para gerenciar afiliados
                        .requestMatchers("/api/v1/affiliates/**").hasRole("USER")

                        // --- REGRA GERAL DA API ---
                        // Garante que todo o resto da API também exija "USER"
                        .requestMatchers("/api/**").hasRole("USER")

                        .anyRequest().denyAll()
                )
                // ... (resto do arquivo: .csrf(), .sessionManagement(), etc.) ...
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(Customizer.withDefaults())
                .addFilterBefore(cookieAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        // ... (resto do logout handler) ...
                        .logoutSuccessHandler((request, response, authentication) -> {
                            ResponseCookie cookie = ResponseCookie.from("authToken", "")
                                    .httpOnly(true)
                                    .secure(true)
                                    .path("/")
                                    .maxAge(0)
                                    .sameSite("Strict")
                                    .build();
                            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
                            response.setStatus(HttpServletResponse.SC_OK);
                        })
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ****** ESTA É A ALTERAÇÃO FEITA ******
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "https://patricio-turismo.onrender.com", // Domínio antigo (pode manter)
                "https://patricioturismo.cloud" // SEU NOVO DOMÍNIO DE PRODUÇÃO
        ));
        // ***************************************

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Inclui "Authorization", "Content-Type" e outros cabeçalhos necessários para CORS e Cookies
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With", "Accept"));

        // ESSENCIAL para o envio de cookies (como o authToken) e credenciais de autenticação
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}