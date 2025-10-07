DROP TABLE IF EXISTS viagem;

-- Em seguida, cria a tabela com a correção
CREATE TABLE viagem (
    id_viagem SERIAL PRIMARY KEY,
    data_hora_partida TIMESTAMP NOT NULL,
    data_hora_chegada TIMESTAMP NOT NULL,
    onibus_id BIGINT NOT NULL,
    FOREIGN KEY (onibus_id) REFERENCES onibus(id_onibus)
);