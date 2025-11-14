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

    // --- Suas Injeções (Mantidas) ---
    @Autowired private PassageiroViagemRepository repository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;
    @Autowired private AssentoRepository assentoRepository;

    // --- Seu método 'save' (Mantido) ---
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

        // --- LÓGICA DE VINCULAR ASSENTO (Mantida) ---
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

    // --- MÉTODO 'update' (CORRIGIDO E PREENCHIDO) ---
    @Transactional
    public Optional<PassengerResponseDto> update(Long id, PassengerSaveRequestDto dto) {
        // 1. Busca a entidade principal
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return Optional.empty(); // Retorna 404 se o passageiro não existe
        }

        var pv = pvOptional.get();
        Assento assentoAntigo = pv.getAssento(); // Guarda o assento antigo para lógica de troca

        // --- INÍCIO DA LÓGICA DE ATUALIZAÇÃO (O QUE FALTAVA) ---

        // 2. Atualiza os campos simples
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        pv.setPago(dto.pago() != null && dto.pago());

        // 3. Atualiza as associações (buscando as novas entidades)
        // Só busca no banco se o ID realmente mudou
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

        // 4. Atualiza Taxista (permite nulo)
        if (dto.taxistaId() == null) {
            pv.setTaxista(null);
        } else if (!Objects.equals(pv.getTaxista() != null ? pv.getTaxista().getId() : null, dto.taxistaId())) {
            Taxista taxista = taxistaRepository.findById(dto.taxistaId())
                    .orElseThrow(() -> new EntityNotFoundException("Taxista não encontrado com ID: " + dto.taxistaId()));
            pv.setTaxista(taxista);
        }

        // 5. Atualiza Comisseiro (permite nulo)
        if (dto.comisseiroId() == null) {
            pv.setComisseiro(null);
        } else if (!Objects.equals(pv.getComisseiro() != null ? pv.getComisseiro().getId() : null, dto.comisseiroId())) {
            Comisseiro comisseiro = comisseiroRepository.findById(dto.comisseiroId())
                    .orElseThrow(() -> new EntityNotFoundException("Comisseiro não encontrado com ID: " + dto.comisseiroId()));
            pv.setComisseiro(comisseiro);
        }

        // --- FIM DA LÓGICA DE ATUALIZAÇÃO ---


        // --- LÓGICA DE ATUALIZAÇÃO DO ASSENTO (Mantida) ---
        Long idAssentoNovo = dto.assentoId();

        if (!Objects.equals(assentoAntigo != null ? assentoAntigo.getId() : null, idAssentoNovo)) {

            if (idAssentoNovo == null && assentoAntigo != null) {
                assentoAntigo.setOcupado(false);
                assentoRepository.save(assentoAntigo);
                pv.setAssento(null);
            }
            else if (idAssentoNovo != null) {
                Assento assentoNovo = assentoRepository.findById(idAssentoNovo)
                        .orElseThrow(() -> new EntityNotFoundException("Novo assento não encontrado com ID: " + idAssentoNovo));

                if (assentoNovo.isOcupado()) {
                    throw new RuntimeException("Assento " + assentoNovo.getNumero() + " já está ocupado.");
                }

                if (assentoAntigo != null) {
                    assentoAntigo.setOcupado(false);
                    assentoRepository.save(assentoAntigo);
                }

                assentoNovo.setOcupado(true);
                pv.setAssento(assentoNovo);
                assentoRepository.save(assentoNovo);
            }
        }
        // --- FIM DA LÓGICA DO ASSENTO ---

        // 6. Salva todas as alterações
        PassageiroViagem pvAtualizado = repository.save(pv);
        return Optional.of(new PassengerResponseDto(pvAtualizado));
    }

    // --- Seu método 'delete' (Mantido) ---
    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) { return false; }

        PassageiroViagem pv = pvOptional.get();
        Assento assento = pv.getAssento();

        if (assento != null) {
            assento.setOcupado(false);
            pv.setAssento(null);
            assentoRepository.save(assento);
        }

        repository.delete(pv);
        return true;
    }

    // --- MÉTODOS DE BUSCA (Preenchidos) ---

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findAll() {
        return repository.findAll().stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> findByViagemId(Long viagemId) {
        // A lógica de busca principal está no ReportController,
        // mas se você chamar este, ele deve funcionar.
        return repository.findByViagemId(viagemId).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<PassengerResponseDto> findById(Long id) {
        return repository.findById(id)
                .map(PassengerResponseDto::new); // Converte para DTO se achar
    }

    // --- MÉTODO 'markAsPaid' (CORRIGIDO E PREENCHIDO) ---
    @Transactional
    public Optional<PassengerResponseDto> markAsPaid(Long id) {

        // 1. Tenta encontrar a entidade pelo ID
        Optional<PassageiroViagem> pvOptional = repository.findById(id);

        // 2. Se não encontrar, retorna um Optional vazio (que o Controller traduzirá para 404)
        if (pvOptional.isEmpty()) {
            return Optional.empty();
        }

        // 3. Se encontrou, atualiza a entidade
        PassageiroViagem pv = pvOptional.get();
        pv.setPago(true);

        // 4. Salva a entidade atualizada
        PassageiroViagem pvSalvo = repository.save(pv);

        // 5. Retorna o DTO com os dados atualizados
        return Optional.of(new PassengerResponseDto(pvSalvo));
    }
}