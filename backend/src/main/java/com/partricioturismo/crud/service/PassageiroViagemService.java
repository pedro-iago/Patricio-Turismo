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

    // INJEÇÃO DO SERVIÇO DE ENCOMENDAS
    @Autowired private EncomendaService encomendaService;

    // === NOVO MÉTODO: REORDENAR ===
    @Transactional
    public void reordenarPassageiros(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            Long id = ids.get(i);
            final int novaOrdem = i;
            repository.findById(id).ifPresent(pv -> {
                pv.setOrdem(novaOrdem);
                repository.save(pv);
            });
        }
    }

    // === NOVO MÉTODO: DESVINCULAR ===
    @Transactional
    public void desvincularGrupo(Long id) {
        PassageiroViagem p = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));
        p.setGrupoId(null);
        repository.save(p);
    }

    // === NOVO MÉTODO: VINCULAR GRUPO ===
    @Transactional
    public void vincularGrupo(Long idOrigem, Long idDestino) {
        PassageiroViagem p1 = repository.findById(idOrigem)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro origem não encontrado"));
        PassageiroViagem p2 = repository.findById(idDestino)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro destino não encontrado"));

        String grupo = p1.getGrupoId();
        if (grupo == null) {
            grupo = java.util.UUID.randomUUID().toString();
            p1.setGrupoId(grupo);
            repository.save(p1);
        }
        p2.setGrupoId(grupo);
        repository.save(p2);
    }

    // === ATRIBUIÇÃO EM MASSA (ATUALIZADO) ===
    @Transactional
    public void atribuirTaxistaEmMassa(List<Long> passageiroIds, List<Long> encomendaIds, Long taxistaId, String tipo) {
        Taxista taxista = null;

        // Se o ID for enviado, busca o taxista. Se for null, taxista permanece null (para desvincular)
        if (taxistaId != null) {
            taxista = taxistaRepository.findById(taxistaId)
                    .orElseThrow(() -> new EntityNotFoundException("Taxista não encontrado"));
        }

        // 1. Atualiza Passageiros
        if (passageiroIds != null && !passageiroIds.isEmpty()) {
            List<PassageiroViagem> lista = repository.findAllById(passageiroIds);
            for (PassageiroViagem pv : lista) {
                if ("COLETA".equalsIgnoreCase(tipo)) {
                    pv.setTaxistaColeta(taxista);
                } else if ("ENTREGA".equalsIgnoreCase(tipo)) {
                    pv.setTaxistaEntrega(taxista);
                }
                repository.save(pv);
            }
        }

        // 2. Atualiza Encomendas (Delegando para o EncomendaService)
        if (encomendaIds != null && !encomendaIds.isEmpty()) {
            encomendaService.atribuirTaxistaEmMassa(encomendaIds, taxistaId, tipo);
        }
    }
    // ========================================

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));

        Endereco endColeta = dto.enderecoColetaId() != null ? enderecoRepository.findById(dto.enderecoColetaId()).orElse(null) : null;
        Endereco endEntrega = dto.enderecoEntregaId() != null ? enderecoRepository.findById(dto.enderecoEntregaId()).orElse(null) : null;

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
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        pv.setPago(dto.pago() != null && dto.pago());

        if (dto.enderecoColetaId() != null) pv.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(pv.getEnderecoColeta()));
        if (dto.enderecoEntregaId() != null) pv.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(pv.getEnderecoEntrega()));

        if (dto.taxistaColetaId() != null) pv.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null));
        if (dto.taxistaEntregaId() != null) pv.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null));
        if (dto.comisseiroId() != null) pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null));

        return Optional.of(new PassengerResponseDto(repository.save(pv)));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) return false;
        PassageiroViagem pv = pvOptional.get();
        if (pv.getAssento() != null) {
            pv.getAssento().setOcupado(false);
            pv.getAssento().setPassageiroViagem(null);
        }
        repository.delete(pv);
        return true;
    }

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

    @Transactional
    public PassengerResponseDto vincularAssentoPorNumero(Long passageiroId, Long onibusId, String numeroAssento) {
        PassageiroViagem pv = repository.findById(passageiroId).orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));

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

        Assento novoAssento = assentoRepository.findByViagemIdAndOnibusIdAndNumero(pv.getViagem().getId(), onibusId, numeroAssento)
                .orElseThrow(() -> new EntityNotFoundException("Assento " + numeroAssento + " não encontrado no ônibus ID " + onibusId));

        if (novoAssento.isOcupado() && !novoAssento.equals(pv.getAssento())) {
            throw new RuntimeException("O assento " + numeroAssento + " já está ocupado.");
        }

        if (pv.getAssento() != null) {
            Assento antigo = pv.getAssento();
            antigo.setOcupado(false);
            antigo.setPassageiroViagem(null);
            assentoRepository.save(antigo);
        }

        novoAssento.setOcupado(true);
        pv.setAssento(novoAssento);
        assentoRepository.save(novoAssento);

        return new PassengerResponseDto(repository.save(pv));
    }

    @Transactional
    public PassengerResponseDto updateCor(Long id, String cor) {
        PassageiroViagem pv = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));
        pv.setCorTag(cor);
        return new PassengerResponseDto(repository.save(pv));
    }
}