package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.PassengerResponseDto;
import com.partricioturismo.crud.dtos.PassengerSaveRequestDto;
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PassageiroViagemService {

    // ... (injeções existentes) ...
    @Autowired private PassageiroViagemRepository repository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;
    @Autowired private AssentoRepository assentoRepository;

    // ... (métodos findAll, findById, findByViagemId, toDto, markAsPaid) ...

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));
        Endereco endColeta = enderecoRepository.findById(dto.enderecoColetaId())
                .orElseThrow(() -> new EntityNotFoundException("Endereço de coleta não encontrado"));
        Endereco endEntrega = enderecoRepository.findById(dto.enderecoEntregaId())
                .orElseThrow(() -> new EntityNotFoundException("Endereço de entrega não encontrado"));

        var pv = new PassageiroViagem();
        // ... (BeanUtils.copyProperties ou set manual) ...
        pv.setPessoa(pessoa); pv.setViagem(viagem); pv.setEnderecoColeta(endColeta); pv.setEnderecoEntrega(endEntrega);
        pv.setValor(dto.valor()); pv.setMetodoPagamento(dto.metodoPagamento()); pv.setPago(dto.pago() != null && dto.pago());
        if (dto.taxistaId() != null) { pv.setTaxista(taxistaRepository.findById(dto.taxistaId()).orElse(null)); }
        if (dto.comisseiroId() != null) { pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null)); }

        // --- LÓGICA CORRIGIDA: VINCULAR ASSENTO COM BOOLEAN ---
        if (dto.assentoId() != null) {
            Assento assento = assentoRepository.findById(dto.assentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Assento não encontrado"));

            if (!assento.getViagem().getId().equals(viagem.getId())) {
                throw new RuntimeException("Assento não pertence a esta viagem.");
            }
            // --- MUDANÇA: Verifica se está OCUPADO ---
            if (assento.isOcupado()) {
                throw new RuntimeException("Assento já está ocupado.");
            }

            assento.setOcupado(true); // <-- MUDANÇA: Ocupa o assento
            pv.setAssento(assento);
        }
        // --- FIM DA LÓGICA CORRIGIDA ---

        PassageiroViagem pvSalvo = repository.save(pv);
        return new PassengerResponseDto(pvSalvo);
    }

    @Transactional
    public Optional<PassengerResponseDto> update(Long id, PassengerSaveRequestDto dto) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) { return Optional.empty(); }

        var pv = pvOptional.get();
        Assento assentoAntigo = pv.getAssento();

        // ... (lógica de atualização de dados) ...

        // --- LÓGICA CORRIGIDA: ATUALIZAR ASSENTO COM BOOLEAN ---
        Long idAssentoNovo = dto.assentoId();

        if (!Objects.equals(assentoAntigo != null ? assentoAntigo.getId() : null, idAssentoNovo)) {
            // Caso B: Trocar ou ocupar novo
            if (idAssentoNovo != null) {
                Assento assentoNovo = assentoRepository.findById(idAssentoNovo)
                        .orElseThrow(() -> new EntityNotFoundException("Novo assento não encontrado"));

                // --- MUDANÇA: Verifica se está OCUPADO ---
                if (assentoNovo.isOcupado()) {
                    throw new RuntimeException("Assento já está ocupado.");
                }

                // Libera o assento antigo
                if (assentoAntigo != null) {
                    assentoAntigo.setOcupado(false); // <-- MUDANÇA: Libera o assento antigo
                    assentoRepository.save(assentoAntigo);
                }

                assentoNovo.setOcupado(true); // <-- MUDANÇA: Ocupa o assento novo
                pv.setAssento(assentoNovo);
            }
            // Caso C: Remover o assento
            else if (assentoAntigo != null) {
                assentoAntigo.setOcupado(false); // <-- MUDANÇA: Libera o assento
                pv.setAssento(null);
                assentoRepository.save(assentoAntigo);
            }
        }
        // --- FIM DA LÓGICA CORRIGIDA ---

        PassageiroViagem pvAtualizado = repository.save(pv);
        return Optional.of(new PassengerResponseDto(pvAtualizado));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) { return false; }

        PassageiroViagem pv = pvOptional.get();
        Assento assento = pv.getAssento();

        if (assento != null) {
            assento.setOcupado(false); // <-- MUDANÇA: Libera o assento
            pv.setAssento(null);
            assentoRepository.save(assento);
        }

        repository.delete(pv);
        return true;
    }

    // ... (Resto do service, incluindo os métodos de listagem e toDto) ...
    public List<PassengerResponseDto> findAll() { /* ... */ return null; }
    public List<PassengerResponseDto> findByViagemId(Long viagemId) { /* ... */ return null; }
    public Optional<PassengerResponseDto> findById(Long id) { /* ... */ return null; }
    public Optional<PassengerResponseDto> markAsPaid(Long id) { /* ... */ return null; }
}