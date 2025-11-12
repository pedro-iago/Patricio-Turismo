package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.AssentoDto;
import com.partricioturismo.crud.repositories.AssentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssentoService {

    @Autowired
    private AssentoRepository assentoRepository;

    /**
     * Busca todos os assentos de uma viagem específica e os converte para DTOs.
     * @param viagemId O ID da viagem.
     * @return Uma lista de AssentoDto, incluindo o status e os dados do passageiro (se houver).
     */
    public List<AssentoDto> findByViagemId(Long viagemId) {
        // Usa o método do repositório que já ordena os assentos pelo número
        return assentoRepository.findByViagemIdOrderByNumero(viagemId)
                .stream()
                .map(AssentoDto::new) // Usa o construtor de conveniência do DTO
                .collect(Collectors.toList());
    }
}