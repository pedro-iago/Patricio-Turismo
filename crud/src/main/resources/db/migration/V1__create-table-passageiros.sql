CREATE TABLE passageiro (
  idPassageiro SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(20),
  endereco VARCHAR(200)
);
