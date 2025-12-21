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
    @Autowired private EncomendaService encomendaService;

    // --- LEITURA ---

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

    // --- HISTÓRICOS ---

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> getHistoricoTaxista(Long taxistaId, LocalDateTime inicio, LocalDateTime fim) {
        return repository.findByTaxistaIdAndViagemDataHoraPartidaBetween(taxistaId, inicio, fim)
                .stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> getHistoricoComisseiro(Long comisseiroId, LocalDateTime inicio, LocalDateTime fim) {
        return repository.findByComisseiroIdAndViagemDataHoraPartidaBetween(comisseiroId, inicio, fim)
                .stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PassengerResponseDto> getHistoricoPessoa(Long pessoaId) {
        return repository.findByPessoaIdWithHistory(pessoaId)
                .stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    // --- ORDENAÇÃO E VÍNCULOS ---

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

    @Transactional
    public void desvincularGrupo(Long id) {
        PassageiroViagem p = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));
        p.setGrupoId(null);
        repository.save(p);
    }

    @Transactional
    public void vincularGrupo(Long idOrigem, Long idDestino) {
        PassageiroViagem origem = repository.findById(idOrigem)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro origem não encontrado"));
        PassageiroViagem destino = repository.findById(idDestino)
                .orElseThrow(() -> new EntityNotFoundException("Passageiro destino não encontrado"));

        String grupoId = destino.getGrupoId();
        if (grupoId == null) {
            grupoId = UUID.randomUUID().toString();
            destino.setGrupoId(grupoId);
            repository.save(destino);
        }
        origem.setGrupoId(grupoId);
        repository.save(origem);
    }

    // --- SALVAR GRUPO FAMÍLIA ---
    @Transactional
    public List<PassengerResponseDto> salvarGrupoFamilia(FamilyGroupRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));

        String grupoId = UUID.randomUUID().toString();
        for(FamilyMemberDto m : dto.membros()) {
            if(m.id() != null) {
                Optional<PassageiroViagem> ex = repository.findById(m.id());
                if(ex.isPresent() && ex.get().getGrupoId() != null) {
                    grupoId = ex.get().getGrupoId();
                    break;
                }
            }
        }

        Taxista tc = dto.taxistaColetaId() != null ? taxistaRepository.findById(dto.taxistaColetaId()).orElse(null) : null;
        Taxista te = dto.taxistaEntregaId() != null ? taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null) : null;
        Comisseiro c = dto.comisseiroId() != null ? comisseiroRepository.findById(dto.comisseiroId()).orElse(null) : null;
        Endereco ec = resolverEndereco(dto.enderecoColeta());
        Endereco ee = resolverEndereco(dto.enderecoEntrega());

        List<PassageiroViagem> listaSalva = new ArrayList<>();

        for (FamilyMemberDto m : dto.membros()) {
            Pessoa pessoa = resolverPessoa(m);
            PassageiroViagem pv = null;

            if (m.id() != null) {
                pv = repository.findById(m.id()).orElse(null);
            }
            if (pv == null) {
                pv = repository.findByPessoaAndViagem(pessoa.getId(), viagem.getId()).orElse(null);
            }
            if (pv == null) {
                pv = new PassageiroViagem();
                pv.setPessoa(pessoa);
                pv.setViagem(viagem);
                Integer max = repository.findMaxOrdemByViagemId(viagem.getId());
                pv.setOrdem(max == null ? 0 : max + 1);
                pv.setPago(false);
            }

            pv.setGrupoId(grupoId);
            pv.setTaxistaColeta(tc);
            pv.setTaxistaEntrega(te);
            pv.setComisseiro(c);
            pv.setEnderecoColeta(ec);
            pv.setEnderecoEntrega(ee);
            pv.setValor(dto.valorIndividual());
            pv.setPessoa(pessoa);

            PassageiroViagem salvo = repository.save(pv);

            // Tenta vincular o assento (agora com lógica inteligente)
            if (m.numeroAssento() != null && !m.numeroAssento().isEmpty()) {
                vincularAssentoPorNumero(salvo.getId(), null, m.numeroAssento());
                salvo = repository.findById(salvo.getId()).orElse(salvo);
            }

            listaSalva.add(salvo);
        }

        return listaSalva.stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    // --- ESCRITA INDIVIDUAL ---

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId()).orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId()).orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        PassageiroViagem pv = new PassageiroViagem();
        pv.setPessoa(pessoa);
        pv.setViagem(viagem);

        atualizarCamposComuns(pv, dto);

        Integer max = repository.findMaxOrdemByViagemId(viagem.getId());
        pv.setOrdem(max == null ? 0 : max + 1);

        pv = repository.save(pv);

        if (dto.assentoId() != null) {
            Assento a = assentoRepository.findById(dto.assentoId()).orElse(null);
            if(a != null) vincularAssentoPorNumero(pv.getId(), null, a.getNumero());
        }
        return new PassengerResponseDto(pv);
    }

    @Transactional
    public Optional<PassengerResponseDto> update(Long id, PassengerSaveRequestDto dto) {
        Optional<PassageiroViagem> pvOpt = repository.findById(id);
        if (pvOpt.isEmpty()) return Optional.empty();
        PassageiroViagem pv = pvOpt.get();
        atualizarCamposComuns(pv, dto);
        return Optional.of(new PassengerResponseDto(repository.save(pv)));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pv = repository.findById(id);
        if (pv.isEmpty()) return false;
        if (pv.get().getAssento() != null) {
            pv.get().getAssento().setOcupado(false);
            pv.get().getAssento().setPassageiroViagem(null);
        }
        repository.delete(pv.get());
        return true;
    }

    @Transactional
    public Optional<PassengerResponseDto> markAsPaid(Long id) {
        return repository.findById(id).map(pv -> {
            pv.setPago(!pv.isPago());
            return new PassengerResponseDto(repository.save(pv));
        });
    }

    @Transactional
    public PassengerResponseDto updateCor(Long id, String cor) {
        PassageiroViagem pv = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));
        pv.setCorTag(cor);
        return new PassengerResponseDto(repository.save(pv));
    }

    // === VINCULAR ASSENTO (LÓGICA CORRIGIDA E MELHORADA) ===
    @Transactional
    public PassengerResponseDto vincularAssentoPorNumero(Long passageiroId, Long onibusId, String numeroAssento) {
        PassageiroViagem pv = repository.findById(passageiroId).orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));

        // 1. OTIMIZAÇÃO: Se o passageiro JÁ está na poltrona certa, não faz nada!
        if (pv.getAssento() != null && numeroAssento != null && numeroAssento.equals(pv.getAssento().getNumero())) {
            return new PassengerResponseDto(pv);
        }

        // Caso: Desvincular (texto vazio)
        if (numeroAssento == null || numeroAssento.isEmpty()) {
            if (pv.getAssento() != null) {
                Assento old = pv.getAssento(); old.setOcupado(false); old.setPassageiroViagem(null); assentoRepository.save(old); pv.setAssento(null);
            }
            return new PassengerResponseDto(repository.save(pv));
        }

        Long busIdTemp = onibusId;
        if (busIdTemp == null && pv.getViagem().getListaOnibus() != null && !pv.getViagem().getListaOnibus().isEmpty()) {
            busIdTemp = pv.getViagem().getListaOnibus().get(0).getIdOnibus();
        }
        if (busIdTemp == null) return new PassengerResponseDto(repository.save(pv));

        final Long finalBusId = busIdTemp;
        Assento novo = assentoRepository.findByViagemIdAndOnibusIdAndNumero(pv.getViagem().getId(), finalBusId, numeroAssento)
                .orElseGet(() -> {
                    Onibus bus = onibusRepository.findById(finalBusId).orElseThrow(() -> new EntityNotFoundException("Ônibus não encontrado"));
                    Assento a = new Assento(); a.setViagem(pv.getViagem()); a.setOnibus(bus); a.setNumero(numeroAssento); a.setOcupado(false);
                    return assentoRepository.save(a);
                });

        // 2. LÓGICA DE ADMIN (ROUBAR ASSENTO):
        // Se está ocupado, remove o dono atual (seja quem for) e passa para o passageiro atual.
        if (novo.isOcupado()) {
            PassageiroViagem ocupanteAtual = novo.getPassageiroViagem();

            if (ocupanteAtual != null && !ocupanteAtual.getId().equals(pv.getId())) {
                // Tira a poltrona do ocupante anterior
                ocupanteAtual.setAssento(null);
                repository.save(ocupanteAtual);

                // Limpa o assento
                novo.setPassageiroViagem(null);
                novo.setOcupado(false);
                assentoRepository.save(novo);
            }
        }

        // Se eu já tinha outro assento, libero o antigo
        if(pv.getAssento() != null && !pv.getAssento().getId().equals(novo.getId())) {
            Assento old = pv.getAssento(); old.setOcupado(false); old.setPassageiroViagem(null); assentoRepository.save(old);
        }

        // Vincula o novo
        novo.setOcupado(true); novo.setPassageiroViagem(pv); pv.setAssento(novo); assentoRepository.save(novo);
        return new PassengerResponseDto(repository.save(pv));
    }

    private void atualizarCamposComuns(PassageiroViagem pv, PassengerSaveRequestDto dto) {
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        pv.setPago(dto.pago() != null && dto.pago());
        if (dto.enderecoColetaId() != null) pv.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(null));
        if (dto.enderecoEntregaId() != null) pv.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(null));
        pv.setTaxistaColeta(dto.taxistaColetaId() != null ? taxistaRepository.findById(dto.taxistaColetaId()).orElse(null) : null);
        pv.setTaxistaEntrega(dto.taxistaEntregaId() != null ? taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null) : null);
        pv.setComisseiro(dto.comisseiroId() != null ? comisseiroRepository.findById(dto.comisseiroId()).orElse(null) : null);
    }

    @Transactional
    public void atribuirTaxistaEmMassa(List<Long> pIds, List<Long> eIds, Long tId, String tipo) {
        Taxista t = tId != null ? taxistaRepository.findById(tId).orElseThrow() : null;
        if (pIds != null) {
            for (PassageiroViagem pv : repository.findAllById(pIds)) {
                if ("COLETA".equalsIgnoreCase(tipo)) pv.setTaxistaColeta(t);
                else if ("ENTREGA".equalsIgnoreCase(tipo)) pv.setTaxistaEntrega(t);
                repository.save(pv);
            }
        }
        if (eIds != null) encomendaService.atribuirTaxistaEmMassa(eIds, tId, tipo);
    }

    private Endereco resolverEndereco(EnderecoDto dto) {
        if(dto == null) return null;
        if(dto.id() != null) return enderecoRepository.findById(dto.id()).orElse(null);
        if(dto.logradouro() != null && !dto.logradouro().isBlank()) {
            Endereco e = new Endereco();
            e.setLogradouro(dto.logradouro()); e.setBairro(dto.bairro()); e.setCidade(dto.cidade()); e.setNumero(dto.numero()); e.setEstado(dto.estado());
            return enderecoRepository.save(e);
        }
        return null;
    }

    private Pessoa resolverPessoa(FamilyMemberDto dto) {
        if(dto.pessoaId() != null) {
            return pessoaRepository.findById(dto.pessoaId()).map(p -> {
                p.setNome(dto.nome()); p.setCpf(dto.cpf()); p.setTelefone(dto.telefone()); return pessoaRepository.save(p);
            }).orElseGet(() -> criarPessoa(dto));
        }
        return criarPessoa(dto);
    }

    private Pessoa criarPessoa(FamilyMemberDto dto) {
        if(dto.cpf() != null && !dto.cpf().isEmpty()) {
            Optional<Pessoa> p = pessoaRepository.findByCpf(dto.cpf());
            if(p.isPresent()) return p.get();
        }
        Pessoa p = new Pessoa(); p.setNome(dto.nome()); p.setCpf(dto.cpf()); p.setTelefone(dto.telefone());
        return pessoaRepository.save(p);
    }
}