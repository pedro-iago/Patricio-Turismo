CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    roles VARCHAR(255) NOT NULL -- Guarda as roles como texto, ex: 'ROLE_ADMIN,ROLE_USER'
);