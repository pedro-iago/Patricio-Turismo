package com.partricioturismo.crud.service;

import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.Viagem;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ViagemSpecs {

    public static Specification<Viagem> comFiltros(Integer mes, Integer ano, String textoBusca) {
        return (root, query, builder) -> {
            // Garante que não traga duplicatas na paginação
            query.distinct(true);

            List<Predicate> predicates = new ArrayList<>();

            // 1. Filtro de Mês (Abordagem Compatível com PostgreSQL)
            // Usamos 'to_char' para extrair o mês como Texto ("01", "11", etc)
            if (mes != null) {
                String mesStr = String.format("%02d", mes); // Garante "05" em vez de "5"

                // PostgreSQL usa 'to_char', H2/MySQL usam outras.
                // Se estiver usando Postgres, esta é a forma mais segura:
                predicates.add(builder.equal(
                        builder.function("to_char", String.class, root.get("dataHoraPartida"), builder.literal("MM")),
                        mesStr
                ));
            }

            // 2. Filtro de Ano
            if (ano != null) {
                String anoStr = String.valueOf(ano);
                predicates.add(builder.equal(
                        builder.function("to_char", String.class, root.get("dataHoraPartida"), builder.literal("YYYY")),
                        anoStr
                ));
            }

            // 3. Busca por Texto (Placa ou Modelo)
            if (textoBusca != null && !textoBusca.trim().isEmpty()) {
                String likePattern = "%" + textoBusca.toLowerCase() + "%";

                // JOIN para acessar os dados do ônibus
                Join<Viagem, Onibus> onibusJoin = root.join("listaOnibus", JoinType.LEFT);

                Predicate placaLike = builder.like(builder.lower(onibusJoin.get("placa")), likePattern);
                Predicate modeloLike = builder.like(builder.lower(onibusJoin.get("modelo")), likePattern);

                predicates.add(builder.or(placaLike, modeloLike));
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }
}