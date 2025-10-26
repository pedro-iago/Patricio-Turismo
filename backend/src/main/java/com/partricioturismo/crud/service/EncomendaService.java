package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.EncomendaDto;
import com.partricioturismo.crud.model.Encomenda;
import com.partricioturismo.crud.model.Endereco;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.EncomendaRepository;
import com.partricioturismo.crud.repositories.EnderecoRepository;
import com.partricioturismo.crud.repositories.PessoaRepository;
import com.partricioturismo.crud.repositories.ViagemRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EncomendaService {

    @Autowired
    private EncomendaRepository repository;
    @Autowired
    private ViagemRepository viagemRepository;
    @Autowired
    private PessoaRepository pessoaRepository;
    @Autowired
    private EnderecoRepository enderecoRepository;

    public List<Encomenda> findAll() {
        return repository.findAll();
    }

    public List<Encomenda> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId);
    }

    public Optional<Encomenda> findById(Long id) {
        return repository.findById(id);
    }

    // Método auxiliar para buscar e setar todas as entidades
    private Encomenda carregarEntidades(Encomenda encomenda, EncomendaDto dto) {
        // 1. Busca entidades obrigatórias
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new RuntimeException("Viagem não encontrada!"));
        Pessoa remetente = pessoaRepository.findById(dto.remetenteId())
                .orElseThrow(() -> new RuntimeException("Remetente (Pessoa) não encontrado!"));
        Pessoa destinatario = pessoaRepository.findById(dto.destinatarioId())
                .orElseThrow(() -> new RuntimeException("Destinatário (Pessoa) não encontrado!"));
        Endereco coleta = enderecoRepository.findById(dto.enderecoColetaId())
                .orElseThrow(() -> new RuntimeException("Endereço de Coleta não encontrado!"));
        Endereco entrega = enderecoRepository.findById(dto.enderecoEntregaId())
                .orElseThrow(() -> new RuntimeException("Endereço de Entrega não encontrado!"));

        // 2. Seta entidades obrigatórias
        encomenda.setViagem(viagem);
        encomenda.setRemetente(remetente);
        encomenda.setDestinatario(destinatario);
        encomenda.setEnderecoColeta(coleta);
        encomenda.setEnderecoEntrega(entrega);

        // 3. Busca e seta entidade opcional (Responsável)
        if (dto.responsavelId() != null) {
            Pessoa responsavel = pessoaRepository.findById(dto.responsavelId())
                    .orElseThrow(() -> new RuntimeException("Responsável (Pessoa) não encontrado!"));
            encomenda.setResponsavel(responsavel);
        } else {
            encomenda.setResponsavel(null); // Garante que fique nulo se o ID for nulo
        }

        return encomenda;
    }

    @Transactional
    public Encomenda save(EncomendaDto dto) {
        Encomenda encomenda = new Encomenda();
        // Copia campos simples (descricao, peso)
        BeanUtils.copyProperties(dto, encomenda);
        // Busca e seta todas as entidades (Viagem, Pessoas, Endereços)
        encomenda = carregarEntidades(encomenda, dto);
        return repository.save(encomenda);
    }

    @Transactional
    public Optional<Encomenda> update(Long id, EncomendaDto dto) {
        Optional<Encomenda> optionalEncomenda = repository.findById(id);
        if (optionalEncomenda.isEmpty()) {
            return Optional.empty();
        }

        Encomenda encomendaModel = optionalEncomenda.get();
        // Copia campos simples (descricao, peso)
        BeanUtils.copyProperties(dto, encomendaModel, "id");
        // Busca e atualiza todas as entidades
        encomendaModel = carregarEntidades(encomendaModel, dto);
        return Optional.of(repository.save(encomendaModel));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Encomenda> optionalEncomenda = repository.findById(id);
        if (optionalEncomenda.isEmpty()) {
            return false;
        }
        repository.delete(optionalEncomenda.get());
        return true;
    }
}