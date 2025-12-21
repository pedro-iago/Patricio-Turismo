package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.*;
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // --- MÉTODOS CRUD BÁSICOS ---

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

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        PassageiroViagem pv = new PassageiroViagem();
        pv.setPessoa(pessoa);
        pv.setViagem(viagem);
        atualizarCamposComuns(pv, dto);

        Integer maxOrdem = repository.findMaxOrdemByViagemId(viagem.getId());
        pv.setOrdem(maxOrdem == null ? 0 : maxOrdem + 1);

        pv = repository.save(pv);
        return new PassengerResponseDto(pv);
    }

    @Transactional
    public PassengerResponseDto update(Long id, PassengerSaveRequestDto dto) {
        PassageiroViagem pv = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PassageiroViagem não encontrado"));
        atualizarCamposComuns(pv, dto);
        return new PassengerResponseDto(repository.save(pv));
    }

    @Transactional
    public void delete(Long id) {
        PassageiroViagem pv = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Registro não encontrado"));
        if (pv.getAssento() != null) {
            Assento a = pv.getAssento();
            a.setOcupado(false);
            a.setPassageiroViagem(null);
            assentoRepository.save(a);
        }
        repository.delete(pv);
    }

    // --- FUNCIONALIDADE CORRIGIDA: GRUPO FAMÍLIA ---

    @Transactional
    public List<PassengerResponseDto> salvarGrupoFamilia(FamilyGroupRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));

        // 1. Resolver Afiliados (Compartilhados)
        Taxista taxistaColeta = dto.taxistaColetaId() != null ? taxistaRepository.findById(dto.taxistaColetaId()).orElse(null) : null;
        Taxista taxistaEntrega = dto.taxistaEntregaId() != null ? taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null) : null;
        Comisseiro comisseiro = dto.comisseiroId() != null ? comisseiroRepository.findById(dto.comisseiroId()).orElse(null) : null;

        // 2. Resolver Endereços (Compartilhados - Reutiliza se tiver ID)
        Endereco enderecoColeta = resolverEnderecoSimples(dto.enderecoColeta());
        Endereco enderecoEntrega = resolverEnderecoSimples(dto.enderecoEntrega());

        // 3. Determinar Grupo ID (Se for edição, tenta pegar de um membro existente)
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
        // Se não achou nenhum grupo existente, gera um novo
        if (grupoId == null) {
            grupoId = UUID.randomUUID().toString();
        }

        List<PassageiroViagem> passageirosSalvos = new ArrayList<>();

        for (FamilyMemberDto membro : dto.membros()) {
            PassageiroViagem pv;

            // --- LÓGICA DE UPDATE vs CREATE ---
            if (membro.id() != null) {
                // É UPDATE: Busca o existente
                pv = repository.findById(membro.id())
                        .orElseThrow(() -> new RuntimeException("Passageiro ID " + membro.id() + " não encontrado."));
            } else {
                // É CREATE: Cria novo
                pv = new PassageiroViagem();
                pv.setViagem(viagem);
                // Define ordem apenas para novos (final da lista)
                Integer maxOrdem = repository.findMaxOrdemByViagemId(viagem.getId());
                pv.setOrdem(maxOrdem == null ? 0 : maxOrdem + 1);

                // Novos começam como não pago
                pv.setPago(false);
            }

            // Atualiza campos (para ambos os casos)
            pv.setGrupoId(grupoId); // Garante vínculo
            pv.setTaxistaColeta(taxistaColeta);
            pv.setTaxistaEntrega(taxistaEntrega);
            pv.setComisseiro(comisseiro);
            pv.setEnderecoColeta(enderecoColeta);
            pv.setEnderecoEntrega(enderecoEntrega);
            pv.setValor(dto.valorIndividual());

            // Resolver Pessoa (usa ID se vier, senão CPF)
            pv.setPessoa(resolverPessoaSimples(membro));

            PassageiroViagem salvo = repository.save(pv);

            // Tenta vincular assento se fornecido
            if (membro.numeroAssento() != null && !membro.numeroAssento().isEmpty()) {
                tendarVincularAssento(salvo, membro.numeroAssento());
            }
            passageirosSalvos.add(salvo);
        }

        return passageirosSalvos.stream().map(PassengerResponseDto::new).collect(Collectors.toList());
    }

    // --- Helpers ---

    private Endereco resolverEnderecoSimples(EnderecoDto dto) {
        if (dto == null) return null;
        // Se vier com ID, busca o existente no banco para não duplicar
        if (dto.id() != null) return enderecoRepository.findById(dto.id()).orElse(null);

        // Se não tem ID, mas tem dados, cria novo
        if (dto.logradouro() != null || dto.cidade() != null) {
            Endereco novo = new Endereco();
            novo.setCidade(dto.cidade());
            novo.setBairro(dto.bairro());
            novo.setLogradouro(dto.logradouro());
            novo.setNumero(dto.numero());
            return enderecoRepository.save(novo);
        }
        return null;
    }

    private Pessoa resolverPessoaSimples(FamilyMemberDto dto) {
        // 1. Tenta buscar por ID (prioridade máxima)
        if (dto.pessoaId() != null) {
            return pessoaRepository.findById(dto.pessoaId()).map(p -> {
                // Atualiza dados cadastrais se mudaram
                boolean mudou = false;
                if (dto.nome() != null && !dto.nome().equals(p.getNome())) { p.setNome(dto.nome()); mudou = true; }
                if (dto.telefone() != null && !dto.telefone().equals(p.getTelefone())) { p.setTelefone(dto.telefone()); mudou = true; }
                if (dto.cpf() != null && !dto.cpf().equals(p.getCpf())) { p.setCpf(dto.cpf()); mudou = true; }
                return mudou ? pessoaRepository.save(p) : p;
            }).orElseGet(() -> criarOuBuscarPorCpf(dto)); // Fallback seguro
        }
        return criarOuBuscarPorCpf(dto);
    }

    private Pessoa criarOuBuscarPorCpf(FamilyMemberDto dto) {
        if (dto.cpf() != null && !dto.cpf().isBlank()) {
            Optional<Pessoa> porCpf = pessoaRepository.findByCpf(dto.cpf());
            if (porCpf.isPresent()) {
                Pessoa p = porCpf.get();
                p.setNome(dto.nome());
                if (dto.telefone() != null) p.setTelefone(dto.telefone());
                return pessoaRepository.save(p);
            }
        }
        // Cria nova
        Pessoa nova = new Pessoa();
        nova.setNome(dto.nome());
        nova.setCpf(dto.cpf());
        nova.setTelefone(dto.telefone());
        return pessoaRepository.save(nova);
    }

    private void tendarVincularAssento(PassageiroViagem pv, String numeroAssento) {
        try {
            if (pv.getViagem().getListaOnibus() != null && !pv.getViagem().getListaOnibus().isEmpty()) {
                Onibus onibus = pv.getViagem().getListaOnibus().get(0);
                vincularAssentoPorNumero(pv.getId(), onibus.getIdOnibus(), numeroAssento);
            }
        } catch (Exception e) {
            // Ignora se estiver ocupado
        }
    }

    private void atualizarCamposComuns(PassageiroViagem pv, PassengerSaveRequestDto dto) {
        if (dto.enderecoColetaId() != null) pv.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(null));
        if (dto.enderecoEntregaId() != null) pv.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(null));

        if (dto.taxistaColetaId() != null) pv.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null));
        else pv.setTaxistaColeta(null);

        if (dto.taxistaEntregaId() != null) pv.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null));
        else pv.setTaxistaEntrega(null);

        if (dto.comisseiroId() != null) pv.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null));
        else pv.setComisseiro(null);

        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        if (dto.pago() != null) pv.setPago(dto.pago());
    }

    // --- MÉTODOS EXTRAS (Mantidos iguais ao seu original) ---

    @Transactional
    public void atribuirTaxistaEmMassa(List<Long> passageirosIds, List<Long> encomendasIds, Long taxistaId, String tipo) {
        Taxista taxista = (taxistaId != null) ? taxistaRepository.findById(taxistaId).orElse(null) : null;
        if (passageirosIds != null && !passageirosIds.isEmpty()) {
            List<PassageiroViagem> passageiros = repository.findAllById(passageirosIds);
            for (PassageiroViagem p : passageiros) {
                if ("COLETA".equalsIgnoreCase(tipo)) p.setTaxistaColeta(taxista);
                else p.setTaxistaEntrega(taxista);
            }
            repository.saveAll(passageiros);
        }
    }

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
    public void vincularGrupo(Long idPassageiro, Long idAlvo) {
        PassageiroViagem pvPrincipal = repository.findById(idPassageiro).orElseThrow();
        PassageiroViagem pvAlvo = repository.findById(idAlvo).orElseThrow();
        String grupoId = pvAlvo.getGrupoId();
        if (grupoId == null) {
            grupoId = UUID.randomUUID().toString();
            pvAlvo.setGrupoId(grupoId);
            repository.save(pvAlvo);
        }
        pvPrincipal.setGrupoId(grupoId);
        repository.save(pvPrincipal);
    }

    @Transactional
    public void desvincularGrupo(Long idPassageiro) {
        PassageiroViagem pv = repository.findById(idPassageiro).orElseThrow();
        pv.setGrupoId(null);
        repository.save(pv);
    }

    @Transactional
    public Optional<PassengerResponseDto> markAsPaid(Long id) {
        Optional<PassageiroViagem> pvOpt = repository.findById(id);
        if (pvOpt.isPresent()) {
            PassageiroViagem pv = pvOpt.get();
            pv.setPago(!pv.isPago());
            repository.save(pv);
            return Optional.of(new PassengerResponseDto(pv));
        }
        return Optional.empty();
    }

    @Transactional
    public PassengerResponseDto vincularAssentoPorNumero(Long passageiroViagemId, Long onibusId, String numeroAssento) {
        PassageiroViagem pv = repository.findById(passageiroViagemId).orElseThrow(() -> new EntityNotFoundException("Passageiro não encontrado"));

        if (numeroAssento == null || numeroAssento.trim().isEmpty()) {
            if (pv.getAssento() != null) {
                Assento antigo = pv.getAssento();
                antigo.setOcupado(false);
                antigo.setPassageiroViagem(null);
                assentoRepository.save(antigo);
                pv.setAssento(null);
            }
            return new PassengerResponseDto(repository.save(pv));
        }

        Assento novoAssento = assentoRepository.findByViagemIdAndOnibusIdAndNumero(pv.getViagem().getId(), onibusId, numeroAssento)
                .orElseGet(() -> {
                    Onibus onibus = onibusRepository.findById(onibusId).orElseThrow(() -> new EntityNotFoundException("Ônibus não encontrado"));
                    Assento assento = new Assento();
                    assento.setViagem(pv.getViagem());
                    assento.setOnibus(onibus);
                    assento.setNumero(numeroAssento);
                    assento.setOcupado(false);
                    return assentoRepository.save(assento);
                });

        if (novoAssento.isOcupado() && !novoAssento.equals(pv.getAssento())) throw new RuntimeException("Assento ocupado");

        if (pv.getAssento() != null) {
            Assento antigo = pv.getAssento();
            antigo.setOcupado(false);
            antigo.setPassageiroViagem(null);
            assentoRepository.save(antigo);
        }
        novoAssento.setOcupado(true);
        novoAssento.setPassageiroViagem(pv);
        pv.setAssento(novoAssento);
        assentoRepository.save(novoAssento);
        return new PassengerResponseDto(repository.save(pv));
    }

    @Transactional
    public PassengerResponseDto updateCor(Long id, String cor) {
        PassageiroViagem pv = repository.findById(id).orElseThrow();
        pv.setCorTag(cor);
        return new PassengerResponseDto(repository.save(pv));
    }
}