package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.EnderecoDto;
import com.partricioturismo.crud.dtos.ViaCepResponseDto;
import com.partricioturismo.crud.model.Endereco;
import com.partricioturismo.crud.repositories.EnderecoRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

// --- IMPORTS NOVOS ---
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EnderecoService {

    @Autowired
    private EnderecoRepository repository;

    private final WebClient webClient;

    @Autowired
    public EnderecoService(EnderecoRepository repository, WebClient.Builder webClientBuilder) {
        this.repository = repository;
        this.webClient = webClientBuilder.baseUrl("https://viacep.com.br/ws").build();
    }

    // --- MÉTODO ATUALIZADO (Passo 4) ---
    public Page<EnderecoDto> findAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(EnderecoDto::new); // Converte a Page<Endereco> para Page<EnderecoDto>
    }

    // ... (mantenha os outros métodos: findById, save, update, delete, search, consultarCep) ...

    public Optional<EnderecoDto> findById(Long id) {
        return repository.findById(id)
                .map(EnderecoDto::new);
    }

    @Transactional
    public EnderecoDto save(EnderecoDto enderecoDto) {
        var endereco = new Endereco();
        BeanUtils.copyProperties(enderecoDto, endereco);
        var enderecoSalvo = repository.save(endereco);
        return new EnderecoDto(enderecoSalvo);
    }

    @Transactional
    public Optional<EnderecoDto> update(Long id, EnderecoDto enderecoDto) {
        Optional<Endereco> enderecoOptional = repository.findById(id);
        if (enderecoOptional.isEmpty()) {
            return Optional.empty();
        }
        var enderecoModel = enderecoOptional.get();
        BeanUtils.copyProperties(enderecoDto, enderecoModel, "id");
        var enderecoAtualizado = repository.save(enderecoModel);
        return Optional.of(new EnderecoDto(enderecoAtualizado));
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

    public List<EnderecoDto> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findTop10ByLogradouroContainingIgnoreCaseOrCep(query, query)
                .stream()
                .map(EnderecoDto::new)
                .collect(Collectors.toList());
    }

    public EnderecoDto consultarCep(String cep) {
        String cepFormatado = cep.replaceAll("[^0-9]", "");
        if (cepFormatado.length() != 8) {
            throw new RuntimeException("CEP inválido. Deve conter 8 dígitos.");
        }
        ViaCepResponseDto viaCepDto = this.webClient.get()
                .uri("/{cep}/json/", cepFormatado)
                .retrieve()
                .bodyToMono(ViaCepResponseDto.class)
                .block();
        if (viaCepDto == null || viaCepDto.erro() != null) {
            throw new RuntimeException("CEP não encontrado.");
        }
        return new EnderecoDto(
                null,
                viaCepDto.logradouro(),
                null,
                viaCepDto.bairro(),
                viaCepDto.localidade(),
                viaCepDto.uf(),
                viaCepDto.cep()
        );
    }
}