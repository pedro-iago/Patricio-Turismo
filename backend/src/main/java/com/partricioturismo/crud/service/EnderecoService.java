package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.EnderecoDto;
import com.partricioturismo.crud.model.Endereco;
import com.partricioturismo.crud.repositories.EnderecoRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EnderecoService {

    @Autowired
    private EnderecoRepository repository;

    public List<Endereco> findAll() {
        return repository.findAll();
    }

    public Optional<Endereco> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Endereco save(EnderecoDto enderecoDto) {
        var endereco = new Endereco();
        BeanUtils.copyProperties(enderecoDto, endereco);
        return repository.save(endereco);
    }

    @Transactional
    public Optional<Endereco> update(Long id, EnderecoDto enderecoDto) {
        Optional<Endereco> enderecoOptional = repository.findById(id);
        if (enderecoOptional.isEmpty()) {
            return Optional.empty();
        }
        var enderecoModel = enderecoOptional.get();
        // Copia tudo, exceto o ID, para garantir
        BeanUtils.copyProperties(enderecoDto, enderecoModel, "id");
        return Optional.of(repository.save(enderecoModel));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Endereco> enderecoOptional = repository.findById(id);
        if (enderecoOptional.isEmpty()) {
            return false;
        }
        repository.delete(enderecoOptional.get());
        return true;
    }
}