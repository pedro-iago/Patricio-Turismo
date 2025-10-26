package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.OnibusRepository;
import com.partricioturismo.crud.repositories.ViagemRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ViagemService {

    @Autowired
    private ViagemRepository viagemRepository;

    @Autowired
    private OnibusRepository onibusRepository;

    public List<Viagem> findAll() {
        return viagemRepository.findAll();
    }

    public Optional<Viagem> findById(Long id) {
        return viagemRepository.findById(id);
    }

    @Transactional
    public Viagem save(ViagemDto viagemDto) {
        Onibus onibus = onibusRepository.findById(viagemDto.onibusId())
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado!"));

        var viagem = new Viagem();
        BeanUtils.copyProperties(viagemDto, viagem);
        viagem.setOnibus(onibus);
        return viagemRepository.save(viagem);
    }

    @Transactional
    public Optional<Viagem> update(Long id, ViagemDto viagemDto) {
        Optional<Viagem> viagemOptional = viagemRepository.findById(id);
        if (viagemOptional.isEmpty()) {
            return Optional.empty();
        }

        Onibus onibus = onibusRepository.findById(viagemDto.onibusId())
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado!"));

        var viagemModel = viagemOptional.get();

        // Ignora o campo 'id' ao copiar as propriedades do DTO para a entidade
        BeanUtils.copyProperties(viagemDto, viagemModel, "id");

        viagemModel.setOnibus(onibus); // Seta o objeto Onibus (pode ter mudado)

        return Optional.of(viagemRepository.save(viagemModel));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Viagem> viagemOptional = viagemRepository.findById(id);
        if (viagemOptional.isEmpty()) {
            return false;
        }
        viagemRepository.delete(viagemOptional.get());
        return true;
    }
}