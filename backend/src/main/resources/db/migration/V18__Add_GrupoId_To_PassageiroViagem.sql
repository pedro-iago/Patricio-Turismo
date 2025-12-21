-- Adiciona a coluna grupo_id APENAS SE ELA NÃO EXISTIR
ALTER TABLE passageiro_viagem ADD COLUMN IF NOT EXISTS grupo_id VARCHAR(255);

-- Cria o índice APENAS SE NÃO EXISTIR
CREATE INDEX IF NOT EXISTS idx_passageiro_viagem_grupo_id ON passageiro_viagem(grupo_id);