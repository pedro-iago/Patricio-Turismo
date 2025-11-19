-- V12__Link_Assento_To_Onibus.sql

-- 1. Adiciona a coluna onibus_id na tabela assento
ALTER TABLE assento ADD COLUMN onibus_id BIGINT;

-- 2. Cria a chave estrangeira para garantir que o assento pertença a um ônibus real
ALTER TABLE assento
    ADD CONSTRAINT fk_assento_onibus
    FOREIGN KEY (onibus_id) REFERENCES onibus (id)
    ON DELETE CASCADE;

-- 3. (Opcional) Tenta corrigir dados legados:
-- Se uma viagem tem APENAS UM ônibus vinculado, atribuímos todos os assentos daquela viagem a ele.
UPDATE assento a
SET onibus_id = vo.onibus_id
FROM viagem_onibus vo
WHERE a.viagem_id = vo.viagem_id
AND a.viagem_id IN (
    SELECT viagem_id FROM viagem_onibus GROUP BY viagem_id HAVING count(*) = 1
);