-- -----------------------------------------------------
-- Funcionalidade 1: Tabelas de Afiliados (Taxista e Comisseiro)
-- -----------------------------------------------------

-- Cria a tabela Taxista, que se referencia a uma Pessoa
CREATE TABLE IF NOT EXISTS Taxista (
  id BIGSERIAL PRIMARY KEY,
  pessoa_id BIGINT NOT NULL,
  -- Adicione outros campos específicos do taxista se precisar (ex: placa_veiculo)
  FOREIGN KEY (pessoa_id) REFERENCES Pessoa (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Cria a tabela Comisseiro, que se referencia a uma Pessoa
CREATE TABLE IF NOT EXISTS Comisseiro (
  id BIGSERIAL PRIMARY KEY,
  pessoa_id BIGINT NOT NULL,
  -- Adicione outros campos específicos do comisseiro se precisar (ex: codigo_afiliado)
  FOREIGN KEY (pessoa_id) REFERENCES Pessoa (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -----------------------------------------------------
-- Funcionalidade 1: Adiciona os links de afiliados
-- -----------------------------------------------------

-- Adiciona as colunas de FK na tabela principal de passageiros
ALTER TABLE passageiro_viagem
  ADD COLUMN taxista_id BIGINT NULL,
  ADD COLUMN comisseiro_id BIGINT NULL,
  ADD CONSTRAINT fk_passageiro_taxista
    FOREIGN KEY (taxista_id) REFERENCES Taxista (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_passageiro_comisseiro
    FOREIGN KEY (comisseiro_id) REFERENCES Comisseiro (id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Adiciona as colunas de FK na tabela de encomendas
ALTER TABLE Encomenda
  ADD COLUMN taxista_id BIGINT NULL,
  ADD COLUMN comisseiro_id BIGINT NULL,
  ADD CONSTRAINT fk_encomenda_taxista
    FOREIGN KEY (taxista_id) REFERENCES Taxista (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_encomenda_comisseiro
    FOREIGN KEY (comisseiro_id) REFERENCES Comisseiro (id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------
-- Funcionalidade 2: Adiciona campos de Valor e Pagamento
-- -----------------------------------------------------

-- Adiciona os campos de pagamento na tabela de passageiros
ALTER TABLE passageiro_viagem
  ADD COLUMN valor DECIMAL(10, 2) NULL,
  ADD COLUMN metodo_pagamento VARCHAR(50) NULL,
  ADD COLUMN pago BOOLEAN NOT NULL DEFAULT false;

-- Adiciona os campos de pagamento na tabela de encomendas
ALTER TABLE Encomenda
  ADD COLUMN valor DECIMAL(10, 2) NULL,
  ADD COLUMN metodo_pagamento VARCHAR(50) NULL,
  ADD COLUMN pago BOOLEAN NOT NULL DEFAULT false;