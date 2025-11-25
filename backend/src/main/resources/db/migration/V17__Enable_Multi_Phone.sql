-- 1. Cria a tabela auxiliar para armazenar múltiplos telefones
CREATE TABLE pessoa_telefones (
    pessoa_id BIGINT NOT NULL,
    telefone VARCHAR(20),
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(id)
);

-- 2. COPIA os dados existentes da coluna antiga para a nova tabela
-- Isso garante que ninguém perde o número que já tinha cadastrado.
INSERT INTO pessoa_telefones (pessoa_id, telefone)
SELECT id, telefone
FROM pessoa
WHERE telefone IS NOT NULL AND telefone <> '';

-- 3. IMPORTANTE: NÃO apagamos a coluna 'telefone' da tabela 'pessoa' neste momento.
-- Ela ficará lá como backup histórico caso algo dê errado.
-- ALTER TABLE pessoa DROP COLUMN telefone; -- (Comentado por segurança)