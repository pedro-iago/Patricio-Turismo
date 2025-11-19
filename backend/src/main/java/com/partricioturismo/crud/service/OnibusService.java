package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.repositories.OnibusRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OnibusService {

    @Autowired
    private OnibusRepository repository;

    // Converte Entidade -> DTO
    private OnibusDto toDto(Onibus onibus) {
        return new OnibusDto(
                onibus.getIdOnibus(),
                onibus.getModelo(),
                onibus.getPlaca(),
                onibus.getCapacidadePassageiros(),
                onibus.getLayoutJson() // <--- Mapeia o JSON do banco para o DTO
        );
    }

    public List<OnibusDto> findAll() {
        return repository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public Optional<OnibusDto> findById(Long id) {
        return repository.findById(id).map(this::toDto);
    }

    @Transactional
    public OnibusDto save(OnibusDto onibusDto) {
        var onibus = new Onibus();
        // Copia as propriedades (incluindo layoutJson se o nome bater)
        BeanUtils.copyProperties(onibusDto, onibus);

        var onibusSalvo = repository.save(onibus);
        return toDto(onibusSalvo);
    }

    @Transactional
    public Optional<OnibusDto> update(Long id, OnibusDto onibusDto) {
        Optional<Onibus> onibusOptional = repository.findById(id);
        if (onibusOptional.isEmpty()) return Optional.empty();

        var onibusModel = onibusOptional.get();
        BeanUtils.copyProperties(onibusDto, onibusModel);

        // Garante que o ID não seja perdido/sobrescrito incorretamente
        onibusModel.setIdOnibus(id);

        var onibusAtualizado = repository.save(onibusModel);
        return Optional.of(toDto(onibusAtualizado));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Onibus> onibusOptional = repository.findById(id);
        if (onibusOptional.isEmpty()) return false;
        repository.delete(onibusOptional.get());
        return true;
    }
}