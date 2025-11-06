package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.PassengerSaveRequestDto;
import com.partricioturismo.crud.dtos.PassengerResponseDto;
import com.partricioturismo.crud.dtos.PessoaDto; // <<< IMPORTAR PessoaDto
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors; // Importar

@Service
public class PassageiroViagemService {

    @Autowired private PassageiroViagemRepository repository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;


    @Transactional(readOnly = true) // Otimização para métodos GET
    public List<PassengerResponseDto> findAll() {
        return repository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PassengerResponseDto> findById(Long id) {
        return repository.findById(id).map(this::convertToDto);
    }

    // Método auxiliar para carregar entidades
    private PassageiroViagem carregarEntidades(PassageiroViagem pv, PassengerSaveRequestDto dto) {

        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada!"));
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada!"));
        Endereco coleta = enderecoRepository.findById(dto.enderecoColetaId())
                .orElseThrow(() -> new EntityNotFoundException("Endereço de Coleta não encontrado!"));
        Endereco entrega = enderecoRepository.findById(dto.enderecoEntregaId())
                .orElseThrow(() -> new EntityNotFoundException("Endereço de Entrega não encontrado!"));

        pv.setPessoa(pessoa);
        pv.setViagem(viagem);
        pv.setEnderecoColeta(coleta);
        pv.setEnderecoEntrega(entrega);

        if (dto.taxistaId() != null) {
            Taxista taxista = taxistaRepository.findById(dto.taxistaId())
                    .orElseThrow(() -> new EntityNotFoundException("Taxista não encontrado com ID: " + dto.taxistaId()));
            pv.setTaxista(taxista);
        } else {
            pv.setTaxista(null);
        }

        if (dto.comisseiroId() != null) {
            // --- CORREÇÃO AQUI ---
            // Corrigido o erro de digitação (o 'D' estava fora das aspas)
            Comisseiro comisseiro = comisseiroRepository.findById(dto.comisseiroId())
                    .orElseThrow(() -> new EntityNotFoundException("Comisseiro não encontrado com ID: " + dto.comisseiroId()));
            pv.setComisseiro(comisseiro);
        } else {
            pv.setComisseiro(null);
        }

        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());

        if (dto.pago() != null) {
            pv.setPago(dto.pago());
        }

        return pv;
    }

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        PassageiroViagem pv = new PassageiroViagem();
        pv = carregarEntidades(pv, dto);
        PassageiroViagem pvSalvo = repository.save(pv);
        return convertToDto(pvSalvo);
    }

    @Transactional
    public Optional<PassengerResponseDto> update(Long id, PassengerSaveRequestDto dto) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return Optional.empty();
        }

        PassageiroViagem pvModel = pvOptional.get();
        pvModel = carregarEntidades(pvModel, dto);
        PassageiroViagem pvAtualizado = repository.save(pvModel);
        return Optional.of(convertToDto(pvAtualizado));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return false;
        }
        repository.delete(pvOptional.get());
        return true;
    }

    @Transactional
    public Optional<PassengerResponseDto> markAsPaid(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return Optional.empty();
        }

        PassageiroViagem pv = pvOptional.get();
        pv.setPago(true);
        PassageiroViagem pvSalvo = repository.save(pv);
        return Optional.of(convertToDto(pvSalvo));
    }

    // Método de conversão privado
    private PassengerResponseDto convertToDto(PassageiroViagem pv) {
        // O construtor do PassengerResponseDto lida com a lógica de conversão
        // e evita os erros de Lazy Loading do Jackson
        return new PassengerResponseDto(pv);
    }
}