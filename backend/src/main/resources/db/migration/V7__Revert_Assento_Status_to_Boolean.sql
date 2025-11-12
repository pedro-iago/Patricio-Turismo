-- 1. Remove a coluna 'status' que depende do ENUM
ALTER TABLE assento DROP COLUMN IF EXISTS status;

-- 2. Remove o tipo ENUM de forma forçada (CASCADE)
-- MUDANÇA CRÍTICA AQUI: Adicionar CASCADE
DROP TYPE IF EXISTS assento_status CASCADE;

-- 3. Adiciona a coluna 'ocupado' (boolean) à tabela 'assento'
ALTER TABLE assento
    ADD COLUMN ocupado BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Recria a restrição UNIQUE na FK (boa prática)
ALTER TABLE passageiro_viagem DROP CONSTRAINT IF EXISTS uq_assento_viagem;

ALTER TABLE passageiro_viagem
    ADD CONSTRAINT uq_assento_viagem
        UNIQUE (assento_id);