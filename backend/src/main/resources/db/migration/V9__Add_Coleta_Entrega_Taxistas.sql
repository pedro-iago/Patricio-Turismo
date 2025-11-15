/* 1. Modificar a tabela 'passageiro_viagem' */
ALTER TABLE passageiro_viagem
    DROP COLUMN taxista_id, /* Remove a coluna antiga */
    ADD COLUMN taxista_coleta_id BIGINT, /* Adiciona a nova coluna de coleta */
    ADD COLUMN taxista_entrega_id BIGINT; /* Adiciona a nova coluna de entrega */

/* 2. Modificar a tabela 'encomenda' */
ALTER TABLE encomenda
    DROP COLUMN taxista_id, /* Remove a coluna antiga */
    ADD COLUMN taxista_coleta_id BIGINT, /* Adiciona a nova coluna de coleta */
    ADD COLUMN taxista_entrega_id BIGINT; /* Adiciona a nova coluna de entrega */

/* 3. Adicionar as chaves estrangeiras (Recomendado) */
ALTER TABLE passageiro_viagem
    ADD CONSTRAINT fk_taxista_coleta FOREIGN KEY (taxista_coleta_id) REFERENCES taxista(id),
    ADD CONSTRAINT fk_taxista_entrega FOREIGN KEY (taxista_entrega_id) REFERENCES taxista(id);

ALTER TABLE encomenda
    ADD CONSTRAINT fk_encomenda_taxista_coleta FOREIGN KEY (taxista_coleta_id) REFERENCES taxista(id),
    ADD CONSTRAINT fk_encomenda_taxista_entrega FOREIGN KEY (taxista_entrega_id) REFERENCES taxista(id);