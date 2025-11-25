package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.PessoaDto;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.repositories.PessoaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.BeanUtils; // Cuidado com BeanUtils e listas
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    // Método auxiliar corrigido
    private PessoaDto toDto(Pessoa pessoa) {
        // Agora o DTO se constrói usando a lista da entidade
        return new PessoaDto(pessoa);
    }

    public Page<PessoaDto> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toDto);
    }

    public Optional<PessoaDto> findById(Long id) {
        return repository.findById(id).map(this::toDto);
    }

    @Transactional
    public PessoaDto save(PessoaDto pessoaDto) {
        if (pessoaDto.cpf() != null && !pessoaDto.cpf().isEmpty() && repository.existsByCpf(pessoaDto.cpf())) {
            throw new RuntimeException("CPF já cadastrado no sistema.");
        }

        var pessoa = new Pessoa();
        pessoa.setNome(pessoaDto.nome());
        pessoa.setCpf(pessoaDto.cpf());
        pessoa.setIdade(pessoaDto.idade());

        // CORREÇÃO: Passando a lista corretamente
        pessoa.setTelefones(pessoaDto.telefones());

        var pessoaSalva = repository.save(pessoa);
        return toDto(pessoaSalva);
    }

    @Transactional
    public Optional<PessoaDto> update(Long id, PessoaDto pessoaDto) {
        Pessoa existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        if (pessoaDto.cpf() != null && !pessoaDto.cpf().equals(existing.getCpf()) && repository.existsByCpf(pessoaDto.cpf())) {
            throw new RuntimeException("Este CPF já pertence a outra pessoa.");
        }

        existing.setNome(pessoaDto.nome());
        existing.setCpf(pessoaDto.cpf());
        existing.setIdade(pessoaDto.idade());

        // CORREÇÃO: Atualizando a lista
        existing.setTelefones(pessoaDto.telefones());

        var pessoaAtualizada = repository.save(existing);
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