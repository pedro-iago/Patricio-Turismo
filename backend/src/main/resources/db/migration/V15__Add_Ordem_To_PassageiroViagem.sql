-- Adiciona a coluna de ordem
ALTER TABLE passageiro_viagem ADD COLUMN ordem INTEGER DEFAULT 0;

-- Inicializa a ordem com o próprio ID para manter uma sequencia inicial lógica
UPDATE passageiro_viagem SET ordem = id;