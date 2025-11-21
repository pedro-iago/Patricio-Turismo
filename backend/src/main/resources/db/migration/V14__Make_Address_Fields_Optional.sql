-- Torna os campos de endereço opcionais
ALTER TABLE endereco ALTER COLUMN logradouro DROP NOT NULL;
ALTER TABLE endereco ALTER COLUMN numero DROP NOT NULL;
ALTER TABLE endereco ALTER COLUMN bairro DROP NOT NULL;
ALTER TABLE endereco ALTER COLUMN cep DROP NOT NULL;

-- Garante que cidade e estado continuem obrigatórios (boa prática reforçar)
ALTER TABLE endereco ALTER COLUMN cidade SET NOT NULL;
ALTER TABLE endereco ALTER COLUMN estado SET NOT NULL;