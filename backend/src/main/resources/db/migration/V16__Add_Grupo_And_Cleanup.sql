-- 1. Adiciona o identificador de grupo para vincular passageiros (Famílias, Casais, etc)
ALTER TABLE passageiro_viagem ADD COLUMN grupo_id VARCHAR(36);
CREATE INDEX idx_passageiro_grupo ON passageiro_viagem(grupo_id);

-- 2. Limpeza: Remove a coluna 'ordem_grid' criada na V11, pois a V15 criou a 'ordem'
-- (Caso você ainda não tenha rodado a V11 em produção, isso não fará mal se a coluna existir)
ALTER TABLE passageiro_viagem DROP COLUMN IF EXISTS ordem_grid;