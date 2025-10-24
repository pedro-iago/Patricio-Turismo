-- Insere um usuário inicial para testes
-- Login: user
-- Senha: senha123 (criptografada com BCrypt)
-- Roles: ROLE_USER (permissão básica)
INSERT INTO usuarios (login, senha, roles)
VALUES ('adm', '$2a$12$7LJCVG2hsI2HF3K8QlT0Z.i70dskjbs55qgDtOiKcQ7vt5JDN2.yG', 'ROLE_USER');

