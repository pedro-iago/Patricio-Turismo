CREATE TABLE onibus (
    id_onibus SERIAL PRIMARY KEY,
    modelo VARCHAR(100) NOT NULL,
    placa VARCHAR(20) NOT NULL,
    capacidade INT NOT NULL
);