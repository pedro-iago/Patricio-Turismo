-- 1. Cria um tipo ENUM para o status do assento (mais eficiente que String)
CREATE TYPE assento_status AS ENUM ('LIVRE', 'OCUPADO');

-- 2. Cria a tabela principal de Assentos
CREATE TABLE IF NOT EXISTS assento (
    id BIGSERIAL PRIMARY KEY,
    numero VARCHAR(10) NOT NULL,       -- Ex: "A1", "14"
    status assento_status NOT NULL DEFAULT 'LIVRE',
    viagem_id BIGINT NOT NULL,

    CONSTRAINT fk_assento_viagem
        FOREIGN KEY (viagem_id) REFERENCES viagem (id)
        ON DELETE CASCADE -- Se a viagem for deletada, os assentos somem com ela.
);

-- 3. Adiciona a coluna 'assento_id' na tabela 'passageiro_viagem'
ALTER TABLE passageiro_viagem
    ADD COLUMN assento_id BIGINT NULL,

    -- Garante que o assento_id é uma chave estrangeira
    ADD CONSTRAINT fk_passageiro_assento
        FOREIGN KEY (assento_id) REFERENCES assento (id)
        ON DELETE SET NULL, -- Se o passageiro for "deletado" da viagem, a referência fica nula

    -- Garante que um assento não possa ser usado por duas pessoas
    ADD CONSTRAINT uq_assento_viagem
        UNIQUE (assento_id);