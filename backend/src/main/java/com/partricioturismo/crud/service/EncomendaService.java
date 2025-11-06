package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.EncomendaSaveRequestDto;
import com.partricioturismo.crud.dtos.EncomendaResponseDto;
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EncomendaService {

    @Autowired private EncomendaRepository repository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;

    @Transactional(readOnly = true)
    public List<EncomendaResponseDto> findAll() {
        return repository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EncomendaResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EncomendaResponseDto> findById(Long id) {
        return repository.findById(id).map(this::convertToDto);
    }

    private Encomenda carregarEntidades(Encomenda encomenda, EncomendaSaveRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada!"));
        Pessoa remetente = pessoaRepository.findById(dto.remetenteId())
                .orElseThrow(() -> new EntityNotFoundException("Remetente não encontrado!"));
        Pessoa destinatario = pessoaRepository.findById(dto.destinatarioId())
                .orElseThrow(() -> new EntityNotFoundException("Destinatário não encontrado!"));
        Endereco coleta = enderecoRepository.findById(dto.enderecoColetaId())
                .orElseThrow(() -> new EntityNotFoundException("Endereço de Coleta não encontrado!"));
        Endereco entrega = enderecoRepository.findById(dto.enderecoEntregaId())
                .orElseThrow(() -> new EntityNotFoundException("Endereço de Entrega não encontrado!"));

        encomenda.setViagem(viagem);
        encomenda.setRemetente(remetente);
        encomenda.setDestinatario(destinatario);
        encomenda.setEnderecoColeta(coleta);
        encomenda.setEnderecoEntrega(entrega);

        if (dto.responsavelId() != null) {
            Pessoa responsavel = pessoaRepository.findById(dto.responsavelId())
                    .orElseThrow(() -> new EntityNotFoundException("Responsável não encontrado!"));
            encomenda.setResponsavel(responsavel);
        } else {
            encomenda.setResponsavel(null);
        }

        if (dto.taxistaId() != null) {
            Taxista taxista = taxistaRepository.findById(dto.taxistaId())
                    .orElseThrow(() -> new EntityNotFoundException("Taxista não encontrado!"));
            encomenda.setTaxista(taxista);
        } else {
            encomenda.setTaxista(null);
        }

        if (dto.comisseiroId() != null) {
            Comisseiro comisseiro = comisseiroRepository.findById(dto.comisseiroId())
                    .orElseThrow(() -> new EntityNotFoundException("Comisseiro não encontrado!"));
            encomenda.setComisseiro(comisseiro);
        } else {
            encomenda.setComisseiro(null);
        }

        encomenda.setValor(dto.valor());
        encomenda.setMetodoPagamento(dto.metodoPagamento());
        if (dto.pago() != null) {
            encomenda.setPago(dto.pago());
        }

        return encomenda;
    }

    @Transactional
    public EncomendaResponseDto save(EncomendaSaveRequestDto dto) {
        Encomenda encomenda = new Encomenda();
        BeanUtils.copyProperties(dto, encomenda);
        encomenda = carregarEntidades(encomenda, dto);
        Encomenda encomendaSalva = repository.save(encomenda);
        return convertToDto(encomendaSalva);
    }

    @Transactional
    public Optional<EncomendaResponseDto> update(Long id, EncomendaSaveRequestDto dto) {
        Optional<Encomenda> optionalEncomenda = repository.findById(id);
        if (optionalEncomenda.isEmpty()) {
            return Optional.empty();
        }
        Encomenda encomendaModel = optionalEncomenda.get();
        BeanUtils.copyProperties(dto, encomendaModel, "id");
        encomendaModel = carregarEntidades(encomendaModel, dto);
        Encomenda encomendaAtualizada = repository.save(encomendaModel);
        return Optional.of(convertToDto(encomendaAtualizada));
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

    @Transactional
    public Optional<EncomendaResponseDto> markAsPaid(Long id) {
        Optional<Encomenda> encOptional = repository.findById(id);
        if (encOptional.isEmpty()) {
            return Optional.empty();
        }
        Encomenda encomenda = encOptional.get();
        encomenda.setPago(true);
        Encomenda encomendaSalva = repository.save(encomenda);
        return Optional.of(convertToDto(encomendaSalva));
    }

    // Método de conversão
    private EncomendaResponseDto convertToDto(Encomenda e) {
        return new EncomendaResponseDto(e);
    }
}