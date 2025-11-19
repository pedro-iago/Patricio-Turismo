package com.partricioturismo.crud.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.partricioturismo.crud.dtos.AssentoDto;
import com.partricioturismo.crud.dtos.AssentoLayoutDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.repositories.AssentoRepository;
import com.partricioturismo.crud.repositories.OnibusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssentoService {

    @Autowired
    private AssentoRepository assentoRepository;

    @Autowired
    private OnibusRepository onibusRepository;

    // Ferramenta para ler o JSON
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Busca assentos ocupados (Lógica original da viagem)
     */
    public List<AssentoDto> findByViagemId(Long viagemId) {
        return assentoRepository.findByViagemIdOrderByNumero(viagemId)
                .stream()
                .map(AssentoDto::new)
                .collect(Collectors.toList());
    }

    /**
     * NOVA FUNCIONALIDADE: Gera o mapa visual dos assentos.
     * Prioridade: Layout JSON > Layout Genérico
     */
    public List<List<AssentoLayoutDto>> getMapaAssentos(Long onibusId) {
        Onibus onibus = onibusRepository.findById(onibusId)
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado"));

        // 1. Estratégia JSON (Customizado)
        if (onibus.getLayoutJson() != null && !onibus.getLayoutJson().isBlank()) {
            try {
                List<List<Integer>> matriz = objectMapper.readValue(
                        onibus.getLayoutJson(),
                        new TypeReference<List<List<Integer>>>(){}
                );
                return converterMatrizParaDto(matriz);
            } catch (Exception e) {
                System.err.println("Erro ao ler layout JSON, usando fallback: " + e.getMessage());
            }
        }

        // 2. Estratégia Genérica (Fallback)
        return gerarLayoutPadrao(onibus.getCapacidadePassageiros());
    }

    private List<List<AssentoLayoutDto>> converterMatrizParaDto(List<List<Integer>> matriz) {
        List<List<AssentoLayoutDto>> layoutVisual = new ArrayList<>();

        for (List<Integer> fileiraNumeros : matriz) {
            List<AssentoLayoutDto> fileiraDtos = new ArrayList<>();
            for (Integer numero : fileiraNumeros) {
                if (numero == 0) {
                    fileiraDtos.add(new AssentoLayoutDto(null, "VAZIO"));
                } else {
                    // Regra: Par = Corredor, Ímpar = Janela
                    String tipo = (numero % 2 == 0) ? "CORREDOR" : "JANELA";
                    String numeroFormatado = String.format("%02d", numero);
                    fileiraDtos.add(new AssentoLayoutDto(numeroFormatado, tipo));
                }
            }
            layoutVisual.add(fileiraDtos);
        }
        return layoutVisual;
    }

    private List<List<AssentoLayoutDto>> gerarLayoutPadrao(int total) {
        List<List<AssentoLayoutDto>> layout = new ArrayList<>();
        int assentoAtual = 1;

        while (assentoAtual <= total) {
            List<AssentoLayoutDto> fileira = new ArrayList<>();
            for (int i = 0; i < 4; i++) {
                if (assentoAtual > total) break;
                String tipo = (assentoAtual % 2 == 0) ? "CORREDOR" : "JANELA";
                fileira.add(new AssentoLayoutDto(String.format("%02d", assentoAtual), tipo));
                assentoAtual++;
            }
            layout.add(fileira);
        }
        return layout;
    }
}