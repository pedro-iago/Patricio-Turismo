package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.PessoaDto;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.repositories.PessoaRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// --- IMPORTS NOVOS ---
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PessoaService {

    @Autowired
    private PessoaRepository repository;

    private PessoaDto toDto(Pessoa pessoa) {
        return new PessoaDto(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getCpf(),
                pessoa.getTelefone(),
                pessoa.getIdade()
        );
    }

    // --- MÉTODO ATUALIZADO (Passo 4) ---
    public Page<PessoaDto> findAll(Pageable pageable) {
        // 1. Busca a página de Entidades
        Page<Pessoa> paginaEntidade = repository.findAll(pageable);
        // 2. Converte a página de Entidades para uma página de DTOs
        return paginaEntidade.map(this::toDto);
    }

    // ... (mantenha os outros métodos: findById, save, update, delete, search) ...

    public Optional<PessoaDto> findById(Long id) {
        return repository.findById(id)
                .map(this::toDto);
    }

    @Transactional
    public PessoaDto save(PessoaDto pessoaDto) {
        var pessoa = new Pessoa();
        BeanUtils.copyProperties(pessoaDto, pessoa);
        var pessoaSalva = repository.save(pessoa);
        return toDto(pessoaSalva);
    }

    @Transactional
    public Optional<PessoaDto> update(Long id, PessoaDto pessoaDto) {
        Optional<Pessoa> pessoaOptional = repository.findById(id);
        if (pessoaOptional.isEmpty()) {
            return Optional.empty();
        }
        var pessoaModel = pessoaOptional.get();
        BeanUtils.copyProperties(pessoaDto, pessoaModel);
        var pessoaAtualizada = repository.save(pessoaModel);
        return Optional.of(toDto(pessoaAtualizada));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Pessoa> pessoaOptional = repository.findById(id);
        if (pessoaOptional.isEmpty()) {
            return false;
        }
        repository.delete(pessoaOptional.get());
        return true;
    }

    public List<PessoaDto> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findTop10ByNomeContainingIgnoreCaseOrCpf(query, query)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}