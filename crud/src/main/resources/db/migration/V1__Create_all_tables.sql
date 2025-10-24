-- -----------------------------------------------------
-- Tabela "Pessoa"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Pessoa (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  telefone VARCHAR(20) NULL,
  idade INT NULL
);

-- -----------------------------------------------------
-- Tabela "Onibus"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Onibus (
  id BIGSERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL UNIQUE,
  modelo VARCHAR(100) NOT NULL,
  capacidade_passageiros INT NOT NULL
);

-- -----------------------------------------------------
-- Tabela "Endereco"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Endereco (
  id BIGSERIAL PRIMARY KEY,
  logradouro VARCHAR(255) NOT NULL,
  numero VARCHAR(10) NULL,
  bairro VARCHAR(100) NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  cep VARCHAR(9) NULL
);

-- -----------------------------------------------------
-- Tabela "Viagem"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Viagem (
  id BIGSERIAL PRIMARY KEY,
  data_hora_partida TIMESTAMP NOT NULL,
  data_hora_chegada TIMESTAMP NOT NULL,
  onibus_id BIGINT NOT NULL,
  FOREIGN KEY (onibus_id) REFERENCES Onibus (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela "PassageiroViagem"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS PassageiroViagem (
  id BIGSERIAL PRIMARY KEY,
  pessoa_id BIGINT NOT NULL,
  viagem_id BIGINT NOT NULL,
  endereco_coleta_id BIGINT NOT NULL,
  endereco_entrega_id BIGINT NOT NULL,
  FOREIGN KEY (pessoa_id) REFERENCES Pessoa (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (viagem_id) REFERENCES Viagem (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (endereco_coleta_id) REFERENCES Endereco (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (endereco_entrega_id) REFERENCES Endereco (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela "Encomenda"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Encomenda (
  id BIGSERIAL PRIMARY KEY,
  descricao VARCHAR(255) NULL,
  peso DECIMAL(10, 2) NULL,
  viagem_id BIGINT NOT NULL,
  remetente_id BIGINT NOT NULL,
  destinatario_id BIGINT NOT NULL,
  endereco_coleta_id BIGINT NOT NULL,
  endereco_entrega_id BIGINT NOT NULL,
  responsavel_id BIGINT NULL,
  FOREIGN KEY (viagem_id) REFERENCES Viagem (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (remetente_id) REFERENCES Pessoa (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (destinatario_id) REFERENCES Pessoa (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (responsavel_id) REFERENCES Pessoa (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (endereco_coleta_id) REFERENCES Endereco (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (endereco_entrega_id) REFERENCES Endereco (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Tabela "Bagagem"
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS Bagagem (
  id BIGSERIAL PRIMARY KEY,
  peso DECIMAL(10, 2) NULL,
  descricao VARCHAR(255) NULL,
  passageiro_viagem_id BIGINT NULL,
  responsavel_id BIGINT NOT NULL,
  FOREIGN KEY (passageiro_viagem_id) REFERENCES PassageiroViagem (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (responsavel_id) REFERENCES Pessoa (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);