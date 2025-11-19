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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PassageiroViagemService {

    @Autowired private PassageiroViagemRepository repository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;
    @Autowired private AssentoRepository assentoRepository;
    @Autowired private BagagemRepository bagagemRepository;

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));

        // Endereços são opcionais na V11, mas se vier ID, deve existir
        Endereco endColeta = null;
        if (dto.enderecoColetaId() != null) {
            endColeta = enderecoRepository.findById(dto.enderecoColetaId())
                    .orElseThrow(() -> new EntityNotFoundException("Endereço de coleta não encontrado"));
        }

        Endereco endEntrega = null;
        if (dto.enderecoEntregaId() != null) {
            endEntrega = enderecoRepository.findById(dto.enderecoEntregaId())
                    .orElseThrow(() -> new EntityNotFoundException("Endereço de entrega não encontrado"));
        }

        var pv = new PassageiroViagem();
        pv.setPessoa(pessoa);
        pv.setViagem(viagem);
        pv.setEnderecoColeta(endColeta);
        pv.setEnderecoEntrega(endEntrega);
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        pv.setPago(dto.pago() != null && dto.pago());

        if (dto.taxistaColetaId() != null) pv.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null));
        if (dto.taxistaEntregaId() != null) pv.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null));
        if (dto.comisseiroId() != null) pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null));

        if (dto.assentoId() != null) {
            Assento assento = assentoRepository.findById(dto.assentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Assento não encontrado"));
            if (!assento.getViagem().getId().equals(viagem.getId())) throw new RuntimeException("Assento não pertence a esta viagem.");
            if (assento.isOcupado()) throw new RuntimeException("Assento já está ocupado.");
            assento.setOcupado(true);
            pv.setAssento(assento);
        }

        PassageiroViagem pvSalvo = repository.save(pv);
        return new PassengerResponseDto(pvSalvo);
    }

    @Transactional
    public Optional<PassengerResponseDto> update(Long id, PassengerSaveRequestDto dto) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) return Optional.empty();

        var pv = pvOptional.get();

        // Atualiza campos básicos
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        pv.setPago(dto.pago() != null && dto.pago());

        // Atualiza Endereços se fornecidos
        if (dto.enderecoColetaId() != null) {
            pv.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(pv.getEnderecoColeta()));
        }
        if (dto.enderecoEntregaId() != null) {
            pv.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(pv.getEnderecoEntrega()));
        }

        // Atualiza Afiliados
        if (dto.taxistaColetaId() != null) pv.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null));
        if (dto.taxistaEntregaId() != null) pv.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null));
        if (dto.comisseiroId() != null) pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null));

        PassageiroViagem pvAtualizado = repository.save(pv);
        return Optional.of(new PassengerResponseDto(pvAtualizado));
    }

    // --- ESTE É O MÉTODO QUE ESTAVA FALTANDO OU INCOMPLETO ---
    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) return false;

        PassageiroViagem pv = pvOptional.get();

        // Libera o assento antes de deletar
        Assento assento = pv.getAssento();
        if (assento != null) {
            assento.setOcupado(false);
            assento.setPassageiroViagem(null);
            pv.setAssento(null);
            assentoRepository.save(assento);
        }

        repository.delete(pv);
        return true;
    }
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findAll() {
        return repository.findAll().stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PassengerResponseDto> findById(Long id) {
        return repository.findById(id).map(PassengerResponseDto::new);
    }

    @Transactional
    public Optional<PassengerResponseDto> markAsPaid(Long id) {
        return repository.findById(id).map(pv -> {
            pv.setPago(true);
            return new PassengerResponseDto(repository.save(pv));
        });
    }

    // --- MÉTODO VINCULAR ASSENTO POR NÚMERO (V12) ---
    @Transactional
    public PassengerResponseDto vincularAssentoPorNumero(Long passageiroId, Long onibusId, String numeroAssento) {
        PassageiroViagem pv = repository.findById(passageiroId)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));

        // Caso de Desvincular
        if (numeroAssento == null || numeroAssento.isEmpty()) {
            if (pv.getAssento() != null) {
                Assento assentoAntigo = pv.getAssento();
                assentoAntigo.setOcupado(false);
                assentoAntigo.setPassageiroViagem(null);
                pv.setAssento(null);
                assentoRepository.save(assentoAntigo);
            }
            return new PassengerResponseDto(repository.save(pv));
        }

        // Busca assento pelo número visual e ID do ônibus
        Assento novoAssento = assentoRepository.findByViagemIdAndOnibusIdAndNumero(
                pv.getViagem().getId(),
                onibusId,
                numeroAssento
        ).orElseThrow(() -> new EntityNotFoundException("Assento " + numeroAssento + " não encontrado no ônibus ID " + onibusId));

        if (novoAssento.isOcupado() && !novoAssento.equals(pv.getAssento())) {
            throw new RuntimeException("O assento " + numeroAssento + " já está ocupado.");
        }

        // Limpa assento antigo se existir
        if (pv.getAssento() != null) {
            Assento antigo = pv.getAssento();
            antigo.setOcupado(false);
            antigo.setPassageiroViagem(null);
            assentoRepository.save(antigo);
        }

        // Vincula novo assento
        novoAssento.setOcupado(true);
        pv.setAssento(novoAssento);
        assentoRepository.save(novoAssento);

        return new PassengerResponseDto(repository.save(pv));
    }

    // --- MÉTODO ATUALIZAR COR (V11) ---
    @Transactional
    public PassengerResponseDto updateCor(Long id, String cor) {
        PassageiroViagem pv = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));

        pv.setCorTag(cor);
        return new PassengerResponseDto(repository.save(pv));
    }
}