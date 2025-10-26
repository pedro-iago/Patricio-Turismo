package com.partricioturismo.crud.service; // (Crie este pacote se não existir)

import com.partricioturismo.crud.dtos.PessoaDto;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.repositories.PessoaRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PessoaService {

    @Autowired
    private PessoaRepository repository;

    public List<Pessoa> findAll() {
        return repository.findAll();
    }

    public Optional<Pessoa> findById(Long id) {
        return repository.findById(id);
    }

    @Transactional
    public Pessoa save(PessoaDto pessoaDto) {
        var pessoa = new Pessoa();
        BeanUtils.copyProperties(pessoaDto, pessoa);
        return repository.save(pessoa);
    }

    @Transactional
    public Optional<Pessoa> update(Long id, PessoaDto pessoaDto) {
        Optional<Pessoa> pessoaOptional = repository.findById(id);
        if (pessoaOptional.isEmpty()) {
            return Optional.empty(); // Retorna vazio se não encontrar
        }
        var pessoaModel = pessoaOptional.get();
        BeanUtils.copyProperties(pessoaDto, pessoaModel);
        return Optional.of(repository.save(pessoaModel)); // Salva e retorna
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Pessoa> pessoaOptional = repository.findById(id);
        if (pessoaOptional.isEmpty()) {
            return false; // Não encontrou, não deletou
        }
        repository.delete(pessoaOptional.get());
        return true; // Encontrou e deletou
    }
}