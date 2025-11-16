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

    @Autowired private PassageiroViagemRepository repository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;
    @Autowired private AssentoRepository assentoRepository;
    @Autowired private BagagemRepository bagagemRepository;

    // --- Método 'save' (Sem alterações) ---
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
        pv.setPessoa(pessoa); pv.setViagem(viagem); pv.setEnderecoColeta(endColeta); pv.setEnderecoEntrega(endEntrega);
        pv.setValor(dto.valor()); pv.setMetodoPagamento(dto.metodoPagamento()); pv.setPago(dto.pago() != null && dto.pago());

        if (dto.taxistaColetaId() != null) {
            pv.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null));
        }
        if (dto.taxistaEntregaId() != null) {
            pv.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null));
        }

        if (dto.comisseiroId() != null) { pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null)); }

        if (dto.assentoId() != null) {
            Assento assento = assentoRepository.findById(dto.assentoId())
                    .orElseThrow(() -> new EntityNotFoundException("Assento não encontrado"));

            if (!assento.getViagem().getId().equals(viagem.getId())) {
                throw new RuntimeException("Assento não pertence a esta viagem.");
            }
            if (assento.isOcupado()) {
                throw new RuntimeException("Assento já está ocupado.");
            }

            assento.setOcupado(true);
            pv.setAssento(assento);
        }

        PassageiroViagem pvSalvo = repository.save(pv);
        return new PassengerResponseDto(pvSalvo);
    }

    // --- Método 'update' (Sem alterações) ---
    @Transactional
    public Optional<PassengerResponseDto> update(Long id, PassengerSaveRequestDto dto) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return Optional.empty();
        }

        var pv = pvOptional.get();
        Assento assentoAntigo = pv.getAssento();

        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        pv.setPago(dto.pago() != null && dto.pago());

        if (dto.pessoaId() != null && !Objects.equals(pv.getPessoa().getId(), dto.pessoaId())) {
            Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                    .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada com ID: " + dto.pessoaId()));
            pv.setPessoa(pessoa);
        }

        if (dto.enderecoColetaId() != null && !Objects.equals(pv.getEnderecoColeta().getId(), dto.enderecoColetaId())) {
            Endereco endColeta = enderecoRepository.findById(dto.enderecoColetaId())
                    .orElseThrow(() -> new EntityNotFoundException("Endereço de coleta não encontrado com ID: " + dto.enderecoColetaId()));
            pv.setEnderecoColeta(endColeta);
        }

        if (dto.enderecoEntregaId() != null && !Objects.equals(pv.getEnderecoEntrega().getId(), dto.enderecoEntregaId())) {
            Endereco endEntrega = enderecoRepository.findById(dto.enderecoEntregaId())
                    .orElseThrow(() -> new EntityNotFoundException("Endereço de entrega não encontrado com ID: " + dto.enderecoEntregaId()));
            pv.setEnderecoEntrega(endEntrega);
        }

        if (dto.taxistaColetaId() == null) {
            pv.setTaxistaColeta(null);
        } else if (!Objects.equals(pv.getTaxistaColeta() != null ? pv.getTaxistaColeta().getId() : null, dto.taxistaColetaId())) {
            Taxista taxistaColeta = taxistaRepository.findById(dto.taxistaColetaId())
                    .orElseThrow(() -> new EntityNotFoundException("Taxista de Coleta não encontrado com ID: " + dto.taxistaColetaId()));
            pv.setTaxistaColeta(taxistaColeta);
        }

        if (dto.taxistaEntregaId() == null) {
            pv.setTaxistaEntrega(null);
        } else if (!Objects.equals(pv.getTaxistaEntrega() != null ? pv.getTaxistaEntrega().getId() : null, dto.taxistaEntregaId())) {
            Taxista taxistaEntrega = taxistaRepository.findById(dto.taxistaEntregaId())
                    .orElseThrow(() -> new EntityNotFoundException("Taxista de Entrega não encontrado com ID: " + dto.taxistaEntregaId()));
            pv.setTaxistaEntrega(taxistaEntrega);
        }

        if (dto.comisseiroId() == null) {
            pv.setComisseiro(null);
        } else if (!Objects.equals(pv.getComisseiro() != null ? pv.getComisseiro().getId() : null, dto.comisseiroId())) {
            Comisseiro comisseiro = comisseiroRepository.findById(dto.comisseiroId())
                    .orElseThrow(() -> new EntityNotFoundException("Comisseiro não encontrado com ID: " + dto.comisseiroId()));
            pv.setComisseiro(comisseiro);
        }

        Long idAssentoNovo = dto.assentoId();

        if (!Objects.equals(assentoAntigo != null ? assentoAntigo.getId() : null, idAssentoNovo)) {

            if (idAssentoNovo == null && assentoAntigo != null) {
                assentoAntigo.setOcupado(false);
                assentoAntigo.setPassageiroViagem(null); // <-- ADICIONADO TAMBÉM
                pv.setAssento(null);
                assentoRepository.save(assentoAntigo);
            }
            else if (idAssentoNovo != null) {
                Assento assentoNovo = assentoRepository.findById(idAssentoNovo)
                        .orElseThrow(() -> new EntityNotFoundException("Novo assento não encontrado com ID: " + idAssentoNovo));

                if (assentoNovo.isOcupado()) {
                    throw new RuntimeException("Assento " + assentoNovo.getNumero() + " já está ocupado.");
                }

                if (assentoAntigo != null) {
                    assentoAntigo.setOcupado(false);
                    assentoAntigo.setPassageiroViagem(null); // <-- ADICIONADO TAMBÉM
                    assentoRepository.save(assentoAntigo);
                }

                assentoNovo.setOcupado(true);
                // assentoNovo.setPassageiroViagem(pv); // O 'pv' já é salvo com o link
                pv.setAssento(assentoNovo);
                // assentoRepository.save(assentoNovo); // Desnecessário salvar o assento aqui, o save(pv) cuida
            }
        }

        PassageiroViagem pvAtualizado = repository.save(pv);

        // Se o assento novo foi setado, precisamos garantir que o link reverso seja salvo
        // (o pv.setAssento() pode não ser suficiente para o 'mappedBy')
        if (pv.getAssento() != null && pv.getAssento().getPassageiroViagem() == null) {
            pv.getAssento().setPassageiroViagem(pvAtualizado);
            assentoRepository.save(pv.getAssento());
        }

        return Optional.of(new PassengerResponseDto(pvAtualizado));
    }

    // --- MUDANÇA: Método 'delete' corrigido ---
    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return false;
        }

        PassageiroViagem pv = pvOptional.get();
        Assento assento = pv.getAssento();

        // 1. Libera o assento E QUEBRA OS DOIS LADOS DO LINK
        if (assento != null) {
            assento.setOcupado(false);
            assento.setPassageiroViagem(null); // <-- A CORREÇÃO ESTÁ AQUI
            pv.setAssento(null);
            assentoRepository.save(assento); // Salva a liberação do assento
        }

        // 2. Remove as dependências (Bagagens)
        List<Bagagem> bagagens = pv.getBagagens();
        if (bagagens != null && !bagagens.isEmpty()) {
            bagagemRepository.deleteAllInBatch(bagagens);
            pv.getBagagens().clear();
        }

        // 3. Deleta o passageiro
        repository.delete(pv);
        return true;
    }
    // --- FIM DA MUDANÇA ---

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findAll() {
        return repository.findAll().stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PassengerResponseDto> findById(Long id) {
        return repository.findById(id)
                .map(PassengerResponseDto::new);
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

        return Optional.of(new PassengerResponseDto(pvSalvo));
    }
}