package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.*;
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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
    @Autowired private OnibusRepository onibusRepository;

    // --- LEITURA BÁSICA ---

    public List<PassengerResponseDto> findAll() {
        return repository.findAll().stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    public Optional<PassengerResponseDto> findById(Long id) {
        return repository.findById(id).map(PassengerResponseDto::new);
    }

    public List<PassengerResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    // --- MÉTODOS QUE FALTAVAM (CORREÇÃO DO ERRO) ---

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> getHistoricoTaxista(Long taxistaId, LocalDateTime inicio, LocalDateTime fim) {
        return repository.findByTaxistaIdAndDateRange(taxistaId, inicio, fim).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> getHistoricoComisseiro(Long comisseiroId, LocalDateTime inicio, LocalDateTime fim) {
        return repository.findByComisseiroIdAndViagemDataHoraPartidaBetween(comisseiroId, inicio, fim).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> getHistoricoPessoa(Long pessoaId) {
        return repository.findByPessoaIdWithHistory(pessoaId).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        PassageiroViagem pv = new PassageiroViagem();
        pv.setPessoa(pessoa);
        pv.setViagem(viagem);

        Integer maxOrdem = repository.findMaxOrdemByViagemId(viagem.getId());
        pv.setOrdem(maxOrdem == null ? 0 : maxOrdem + 1);

        atualizarCamposComuns(pv, dto);

        pv = repository.save(pv);

        if (dto.assentoId() != null) {
            vincularAssentoExistente(pv, dto.assentoId());
        }

        return new PassengerResponseDto(pv);
    }

    @Transactional
    public PassengerResponseDto update(Long id, PassengerSaveRequestDto dto) {
        PassageiroViagem pv = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PassageiroViagem não encontrado"));

        atualizarCamposComuns(pv, dto);

        PassageiroViagem salvo = repository.save(pv);

        if (dto.assentoId() != null) {
            vincularAssentoExistente(salvo, dto.assentoId());
        }

        return new PassengerResponseDto(salvo);
    }

    @Transactional
    public void delete(Long id) {
        PassageiroViagem pv = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Registro não encontrado"));
        if (pv.getAssento() != null) {
            Assento a = pv.getAssento();
            a.setOcupado(false);
            a.setPassageiroViagem(null);
            assentoRepository.save(a);
        }
        repository.delete(pv);
    }

    @Transactional
    public List<PassengerResponseDto> salvarGrupoFamilia(FamilyGroupRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId()).orElseThrow();

        String grupoId = null;
        for (FamilyMemberDto membro : dto.membros()) {
            if (membro.id() != null) {
                Optional<PassageiroViagem> existente = repository.findById(membro.id());
                if (existente.isPresent() && existente.get().getGrupoId() != null) {
                    grupoId = existente.get().getGrupoId();
                    break;
                }
            }
        }
        if (grupoId == null) grupoId = UUID.randomUUID().toString();

        Taxista txColeta = dto.taxistaColetaId() != null ? taxistaRepository.findById(dto.taxistaColetaId()).orElse(null) : null;
        Taxista txEntrega = dto.taxistaEntregaId() != null ? taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null) : null;
        Comisseiro comisseiro = dto.comisseiroId() != null ? comisseiroRepository.findById(dto.comisseiroId()).orElse(null) : null;
        Endereco endColeta = resolverEnderecoSimples(dto.enderecoColeta());
        Endereco endEntrega = resolverEnderecoSimples(dto.enderecoEntrega());

        List<PassageiroViagem> salvos = new ArrayList<>();

        for (FamilyMemberDto membro : dto.membros()) {
            PassageiroViagem pv;
            if (membro.id() != null) {
                pv = repository.findById(membro.id()).orElseThrow();
            } else {
                pv = new PassageiroViagem();
                pv.setViagem(viagem);
                Integer max = repository.findMaxOrdemByViagemId(viagem.getId());
                pv.setOrdem(max == null ? 0 : max + 1);
                pv.setPago(false);
            }

            pv.setGrupoId(grupoId);
            pv.setTaxistaColeta(txColeta);
            pv.setTaxistaEntrega(txEntrega);
            pv.setComisseiro(comisseiro);
            pv.setEnderecoColeta(endColeta);
            pv.setEnderecoEntrega(endEntrega);
            pv.setValor(dto.valorIndividual());
            pv.setPessoa(resolverPessoaSimples(membro));

            PassageiroViagem saved = repository.save(pv);

            if (membro.numeroAssento() != null && !membro.numeroAssento().isEmpty()) {
                tendarVincularAssentoPorNumero(saved, membro.numeroAssento());
            }
            salvos.add(saved);
        }
        return salvos.stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    @Transactional
    public Optional<PassengerResponseDto> markAsPaid(Long id) {
        Optional<PassageiroViagem> pvOpt = repository.findById(id);
        if (pvOpt.isPresent()) {
            PassageiroViagem pv = pvOpt.get();
            pv.setPago(!pv.isPago());
            return Optional.of(new PassengerResponseDto(repository.save(pv)));
        }
        return Optional.empty();
    }

    @Transactional
    public PassengerResponseDto updateCor(Long id, String cor) {
        PassageiroViagem pv = repository.findById(id).orElseThrow();
        pv.setCorTag(cor);
        return new PassengerResponseDto(repository.save(pv));
    }

    @Transactional
    public PassengerResponseDto vincularAssentoPorNumero(Long passageiroViagemId, Long onibusId, String numeroAssento) {
        PassageiroViagem pv = repository.findById(passageiroViagemId).orElseThrow();
        if (numeroAssento == null || numeroAssento.trim().isEmpty()) {
            desvincularAssento(pv);
            return new PassengerResponseDto(repository.save(pv));
        }
        Assento novo = assentoRepository.findByViagemIdAndOnibusIdAndNumero(pv.getViagem().getId(), onibusId, numeroAssento)
                .orElseGet(() -> {
                    Onibus onibus = onibusRepository.findById(onibusId).orElseThrow();
                    Assento a = new Assento();
                    a.setViagem(pv.getViagem());
                    a.setOnibus(onibus);
                    a.setNumero(numeroAssento);
                    a.setOcupado(false);
                    return assentoRepository.save(a);
                });

        if (novo.isOcupado() && !novo.equals(pv.getAssento())) throw new RuntimeException("Ocupado");

        desvincularAssento(pv);
        novo.setOcupado(true);
        novo.setPassageiroViagem(pv);
        pv.setAssento(novo);
        assentoRepository.save(novo);
        return new PassengerResponseDto(repository.save(pv));
    }

    // --- HELPERS ---
    private void atualizarCamposComuns(PassageiroViagem pv, PassengerSaveRequestDto dto) {
        if (dto.enderecoColetaId() != null) pv.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(null));
        if (dto.enderecoEntregaId() != null) pv.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(null));
        if (dto.taxistaColetaId() != null) pv.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null)); else pv.setTaxistaColeta(null);
        if (dto.taxistaEntregaId() != null) pv.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null)); else pv.setTaxistaEntrega(null);
        if (dto.comisseiroId() != null) pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null)); else pv.setComisseiro(null);
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        if (dto.pago() != null) pv.setPago(dto.pago());
    }

    private void vincularAssentoExistente(PassageiroViagem pv, Long assentoId) {
        Assento assento = assentoRepository.findById(assentoId).orElse(null);
        if (assento != null && !assento.isOcupado()) {
            desvincularAssento(pv);
            assento.setOcupado(true);
            assento.setPassageiroViagem(pv);
            pv.setAssento(assento);
            assentoRepository.save(assento);
        }
    }

    private void desvincularAssento(PassageiroViagem pv) {
        if (pv.getAssento() != null) {
            Assento a = pv.getAssento();
            a.setOcupado(false);
            a.setPassageiroViagem(null);
            assentoRepository.save(a);
            pv.setAssento(null);
        }
    }

    private void tendarVincularAssentoPorNumero(PassageiroViagem pv, String numeroAssento) {
        try {
            if (pv.getViagem().getListaOnibus() != null && !pv.getViagem().getListaOnibus().isEmpty()) {
                vincularAssentoPorNumero(pv.getId(), pv.getViagem().getListaOnibus().get(0).getIdOnibus(), numeroAssento);
            }
        } catch (Exception e) {}
    }

    private Endereco resolverEnderecoSimples(EnderecoDto dto) {
        if (dto == null) return null;
        if (dto.id() != null) return enderecoRepository.findById(dto.id()).orElse(null);
        if (dto.logradouro() != null) {
            Endereco n = new Endereco();
            n.setCidade(dto.cidade()); n.setBairro(dto.bairro()); n.setLogradouro(dto.logradouro()); n.setNumero(dto.numero()); n.setEstado(dto.estado());
            return enderecoRepository.save(n);
        }
        return null;
    }

    private Pessoa resolverPessoaSimples(FamilyMemberDto dto) {
        if (dto.pessoaId() != null) {
            return pessoaRepository.findById(dto.pessoaId()).map(p -> {
                if (dto.nome() != null) p.setNome(dto.nome());
                if (dto.cpf() != null) p.setCpf(dto.cpf());
                if (dto.telefone() != null) p.setTelefone(dto.telefone());
                return pessoaRepository.save(p);
            }).orElseGet(() -> criarOuBuscarPorCpf(dto));
        }
        return criarOuBuscarPorCpf(dto);
    }

    private Pessoa criarOuBuscarPorCpf(FamilyMemberDto dto) {
        if (dto.cpf() != null && !dto.cpf().isBlank()) {
            Optional<Pessoa> p = pessoaRepository.findByCpf(dto.cpf());
            if (p.isPresent()) return p.get();
        }
        Pessoa nova = new Pessoa();
        nova.setNome(dto.nome()); nova.setCpf(dto.cpf()); nova.setTelefone(dto.telefone());
        return pessoaRepository.save(nova);
    }
}