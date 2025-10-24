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
    private OnibusRepository onibusRepository; // <-- PRECISAMOS DELE

    public List<Viagem> findAll() {
        return viagemRepository.findAll();
    }

    public Optional<Viagem> findById(Long id) {
        return viagemRepository.findById(id);
    }

    @Transactional
    public Viagem save(ViagemDto viagemDto) {
        // 1. Buscar o Onibus pelo ID
        Onibus onibus = onibusRepository.findById(viagemDto.onibusId())
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado!"));

        // 2. Copiar os dados simples (datas)
        var viagem = new Viagem();
        BeanUtils.copyProperties(viagemDto, viagem);

        // 3. Setar o objeto Onibus (aqui corrigimos o bug)
        viagem.setOnibus(onibus);

        // 4. Salvar
        return viagemRepository.save(viagem);
    }

    @Transactional
    public Optional<Viagem> update(Long id, ViagemDto viagemDto) {
        Optional<Viagem> viagemOptional = viagemRepository.findById(id);
        if (viagemOptional.isEmpty()) {
            return Optional.empty();
        }

        // 1. Buscar o Onibus pelo ID (pode ter mudado)
        Onibus onibus = onibusRepository.findById(viagemDto.onibusId())
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado!"));

        // 2. Pegar a viagem existente
        var viagemModel = viagemOptional.get();

        // 3. Copiar dados simples (datas)
        BeanUtils.copyProperties(viagemDto, viagemModel);

        // 4. Setar o objeto Onibus
        viagemModel.setOnibus(onibus);

        // 5. Salvar
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