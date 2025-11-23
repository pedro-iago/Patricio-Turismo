package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.PessoaDto;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.repositories.PessoaRepository;
import jakarta.persistence.EntityNotFoundException; // Importe isto
import org.springframework.beans.BeanUtils;
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

    private PessoaDto toDto(Pessoa pessoa) {
        return new PessoaDto(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getCpf(),
                pessoa.getTelefone(),
                pessoa.getIdade()
        );
    }

    public Page<PessoaDto> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toDto);
    }

    public Optional<PessoaDto> findById(Long id) {
        return repository.findById(id).map(this::toDto);
    }

    @Transactional
    public PessoaDto save(PessoaDto pessoaDto) {
        // Validação de CPF
        if (repository.existsByCpf(pessoaDto.cpf())) {
            throw new RuntimeException("CPF já cadastrado no sistema.");
        }

        var pessoa = new Pessoa();
        BeanUtils.copyProperties(pessoaDto, pessoa);
        var pessoaSalva = repository.save(pessoa);
        return toDto(pessoaSalva);
    }

    // === CORREÇÃO CRÍTICA DO UPDATE ===
    @Transactional
    public Optional<PessoaDto> update(Long id, PessoaDto pessoaDto) {
        // 1. Busca a entidade gerenciada
        Pessoa existing = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        // 2. Validação de CPF (apenas se mudou)
        if (!existing.getCpf().equals(pessoaDto.cpf()) && repository.existsByCpf(pessoaDto.cpf())) {
            throw new RuntimeException("Este CPF já pertence a outra pessoa.");
        }

        // 3. Atualiza os campos manualmente (EVITA MUDAR O ID)
        existing.setNome(pessoaDto.nome());
        existing.setCpf(pessoaDto.cpf());
        existing.setTelefone(pessoaDto.telefone());
        existing.setIdade(pessoaDto.idade());

        // 4. Salva
        var pessoaAtualizada = repository.save(existing);
        return Optional.of(toDto(pessoaAtualizada));
    }
    // =================================

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