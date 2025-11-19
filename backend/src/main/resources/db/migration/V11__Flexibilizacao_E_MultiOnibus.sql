-- ---------------------------------------------------------
-- 1. FLEXIBILIZAÇÃO DE ENDEREÇOS
-- ---------------------------------------------------------

-- Permite endereços parciais (ex: só cidade, sem rua)
ALTER TABLE endereco ALTER COLUMN logradouro DROP NOT NULL;
ALTER TABLE endereco ALTER COLUMN cidade DROP NOT NULL; -- Caso seja só uma região
ALTER TABLE endereco ALTER COLUMN estado DROP NOT NULL;

-- Permite que o passageiro não tenha coleta ou entrega definida ainda
ALTER TABLE passageiro_viagem ALTER COLUMN endereco_coleta_id DROP NOT NULL;
ALTER TABLE passageiro_viagem ALTER COLUMN endereco_entrega_id DROP NOT NULL;

ALTER TABLE encomenda ALTER COLUMN endereco_coleta_id DROP NOT NULL;
ALTER TABLE encomenda ALTER COLUMN endereco_entrega_id DROP NOT NULL;


-- ---------------------------------------------------------
-- 2. VIAGEM COM MÚLTIPLOS ÔNIBUS
-- ---------------------------------------------------------

-- Cria tabela de junção (Muitos-para-Muitos)
CREATE TABLE viagem_onibus (
    viagem_id BIGINT NOT NULL,
    onibus_id BIGINT NOT NULL,
    PRIMARY KEY (viagem_id, onibus_id),
    CONSTRAINT fk_vo_viagem FOREIGN KEY (viagem_id) REFERENCES viagem(id) ON DELETE CASCADE,
    CONSTRAINT fk_vo_onibus FOREIGN KEY (onibus_id) REFERENCES onibus(id) ON DELETE RESTRICT
);

-- (Opcional) Migrar dados antigos: Pega o onibus_id atual e joga na nova tabela
INSERT INTO viagem_onibus (viagem_id, onibus_id)
SELECT id, onibus_id FROM viagem WHERE onibus_id IS NOT NULL;

-- Remove a coluna antiga de relação 1 para 1
ALTER TABLE viagem DROP COLUMN onibus_id;


-- ---------------------------------------------------------
-- 3. TAGS E ORDENAÇÃO NA LISTA (Grid Flexível)
-- ---------------------------------------------------------

-- 'ordem_grid': índice numérico para o Drag & Drop
-- 'cor_tag': código Hex (ex: #FF0000) para agrupar famílias
ALTER TABLE passageiro_viagem ADD COLUMN ordem_grid INTEGER DEFAULT 0;
ALTER TABLE passageiro_viagem ADD COLUMN cor_tag VARCHAR(20) DEFAULT NULL;

ALTER TABLE encomenda ADD COLUMN ordem_grid INTEGER DEFAULT 0;
ALTER TABLE encomenda ADD COLUMN cor_tag VARCHAR(20) DEFAULT NULL;