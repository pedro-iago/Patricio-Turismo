package com.partricioturismo.crud.service; // (Crie este pacote se não existir)

import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.repositories.OnibusRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class OnibusService {

    @Autowired
    private OnibusRepository repository;

    public List<Onibus> findAll() {
        return repository.findAll();
    }

    public Optional<Onibus> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Onibus save(OnibusDto onibusDto) {
        var onibus = new Onibus();
        BeanUtils.copyProperties(onibusDto, onibus);
        return repository.save(onibus);
    }

    @Transactional
    public Optional<Onibus> update(Long id, OnibusDto onibusDto) {
        Optional<Onibus> onibusOptional = repository.findById(id);
        if (onibusOptional.isEmpty()) {
            return Optional.empty();
        }
        var onibusModel = onibusOptional.get();
        BeanUtils.copyProperties(onibusDto, onibusModel);
        return Optional.of(repository.save(onibusModel));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Onibus> onibusOptional = repository.findById(id);
        if (onibusOptional.isEmpty()) {
            return false;
        }
        repository.delete(onibusOptional.get());
        return true;
    }
}