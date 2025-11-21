package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.EnderecoDto;
import com.partricioturismo.crud.dtos.ViaCepResponseDto;
import com.partricioturismo.crud.model.Endereco;
import com.partricioturismo.crud.repositories.EnderecoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

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

    public Page<EnderecoDto> findAll(Pageable pageable) {
        return repository.findAll(pageable)
                .map(EnderecoDto::new);
    }

    public Optional<EnderecoDto> findById(Long id) {
        return repository.findById(id)
                .map(EnderecoDto::new);
    }

    @Transactional
    public EnderecoDto save(EnderecoDto dto) {
        var endereco = new Endereco();
        // Mapeamento manual é mais seguro para Records do que BeanUtils
        endereco.setLogradouro(dto.logradouro());
        endereco.setNumero(dto.numero());
        endereco.setBairro(dto.bairro());
        endereco.setCidade(dto.cidade());
        endereco.setEstado(dto.estado());
        endereco.setCep(dto.cep());

        var enderecoSalvo = repository.save(endereco);
        return new EnderecoDto(enderecoSalvo);
    }

    @Transactional
    public Optional<EnderecoDto> update(Long id, EnderecoDto dto) {
        Optional<Endereco> enderecoOptional = repository.findById(id);
        if (enderecoOptional.isEmpty()) {
            return Optional.empty();
        }
        var endereco = enderecoOptional.get();

        // Atualiza os campos
        endereco.setLogradouro(dto.logradouro());
        endereco.setNumero(dto.numero());
        endereco.setBairro(dto.bairro());
        endereco.setCidade(dto.cidade());
        endereco.setEstado(dto.estado());
        endereco.setCep(dto.cep());

        var enderecoAtualizado = repository.save(endereco);
        return Optional.of(new EnderecoDto(enderecoAtualizado));
    }

    @Transactional
    public boolean delete(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    // --- CORREÇÃO DO ERRO DE COMPILAÇÃO AQUI ---
    public List<EnderecoDto> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        // Agora chama o método correto definido no Repository
        return repository.search(query)
                .stream()
                .map(EnderecoDto::new)
                .collect(Collectors.toList());
    }

    public EnderecoDto consultarCep(String cep) {
        String cepFormatado = cep.replaceAll("[^0-9]", "");
        if (cepFormatado.length() != 8) {
            throw new RuntimeException("CEP inválido. Deve conter 8 dígitos.");
        }

        try {
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
        } catch (Exception e) {
            throw new RuntimeException("Erro ao consultar CEP: " + e.getMessage());
        }
    }
}