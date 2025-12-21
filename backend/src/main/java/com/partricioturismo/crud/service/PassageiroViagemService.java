package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.*;
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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

    // --- LEITURA PADRÃO (SIMPLES E RÁPIDA) ---

    public List<PassengerResponseDto> findAll(int page, int size) {
        // Apenas paginação padrão do JPA, sem inventar moda
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return repository.findAll(pageable).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    public List<PassengerResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
    }

    public Optional<PassengerResponseDto> findById(Long id) {
        return repository.findById(id).map(PassengerResponseDto::new);
    }

    // --- MÉTODOS DE RELATÓRIO (NECESSÁRIOS) ---

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

    // --- ESCRITA (CRIAÇÃO E ATUALIZAÇÃO) ---

    @Transactional
    public PassengerResponseDto save(PassengerSaveRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId()).orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId()).orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        PassageiroViagem pv = new PassageiroViagem();
        pv.setPessoa(pessoa);
        pv.setViagem(viagem);

        Integer max = repository.findMaxOrdemByViagemId(viagem.getId());
        pv.setOrdem(max == null ? 0 : max + 1);

        atualizarCamposComuns(pv, dto);
        pv = repository.save(pv);

        if (dto.assentoId() != null) vincularAssentoExistente(pv, dto.assentoId());

        return new PassengerResponseDto(pv);
    }

    @Transactional
    public PassengerResponseDto update(Long id, PassengerSaveRequestDto dto) {
        PassageiroViagem pv = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Registro não encontrado"));
        atualizarCamposComuns(pv, dto);

        PassageiroViagem salvo = repository.save(pv);
        if (dto.assentoId() != null) vincularAssentoExistente(salvo, dto.assentoId());

        return new PassengerResponseDto(salvo);
    }

    @Transactional
    public void delete(Long id) {
        PassageiroViagem pv = repository.findById(id).orElseThrow();
        if(pv.getAssento() != null) {
            Assento a = pv.getAssento();
            a.setOcupado(false);
            a.setPassageiroViagem(null);
            assentoRepository.save(a);
        }
        repository.delete(pv);
    }

    // --- GRUPO FAMILIAR E OUTROS ---

    @Transactional
    public List<PassengerResponseDto> salvarGrupoFamilia(FamilyGroupRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId()).orElseThrow();
        String grupoId = UUID.randomUUID().toString();

        // Tenta achar grupo existente
        for(FamilyMemberDto m : dto.membros()) {
            if(m.id() != null) {
                Optional<PassageiroViagem> ex = repository.findById(m.id());
                if(ex.isPresent() && ex.get().getGrupoId() != null) { grupoId = ex.get().getGrupoId(); break; }
            }
        }

        Taxista tc = dto.taxistaColetaId() != null ? taxistaRepository.findById(dto.taxistaColetaId()).orElse(null) : null;
        Taxista te = dto.taxistaEntregaId() != null ? taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null) : null;
        Comisseiro c = dto.comisseiroId() != null ? comisseiroRepository.findById(dto.comisseiroId()).orElse(null) : null;
        Endereco ec = resolverEndereco(dto.enderecoColeta());
        Endereco ee = resolverEndereco(dto.enderecoEntrega());

        List<PassageiroViagem> lista = new ArrayList<>();
        for (FamilyMemberDto m : dto.membros()) {
            PassageiroViagem pv = (m.id() != null) ? repository.findById(m.id()).orElse(new PassageiroViagem()) : new PassageiroViagem();
            if(pv.getId() == null) {
                pv.setViagem(viagem);
                Integer max = repository.findMaxOrdemByViagemId(viagem.getId());
                pv.setOrdem(max == null ? 0 : max + 1);
                pv.setPago(false);
            }
            pv.setGrupoId(grupoId);
            pv.setTaxistaColeta(tc); pv.setTaxistaEntrega(te); pv.setComisseiro(c);
            pv.setEnderecoColeta(ec); pv.setEnderecoEntrega(ee);
            pv.setValor(dto.valorIndividual());
            pv.setPessoa(resolverPessoa(m));

            PassageiroViagem salvo = repository.save(pv);
            if(m.numeroAssento() != null && !m.numeroAssento().isEmpty()) vincularAssentoString(salvo, m.numeroAssento());
            lista.add(salvo);
        }
        return lista.stream().map(PassengerResponseDto::new).collect(Collectors.toList());
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
        PassageiroViagem pv = repository.findById(id).orElseThrow();
        pv.setCorTag(cor);
        return new PassengerResponseDto(repository.save(pv));
    }

    @Transactional
    public PassengerResponseDto vincularAssentoPorNumero(Long id, Long onibusId, String numero) {
        PassageiroViagem pv = repository.findById(id).orElseThrow();
        if(numero == null || numero.isEmpty()) {
            if(pv.getAssento() != null) { Assento a = pv.getAssento(); a.setOcupado(false); a.setPassageiroViagem(null); assentoRepository.save(a); pv.setAssento(null); }
            return new PassengerResponseDto(repository.save(pv));
        }

        Assento assento = assentoRepository.findByViagemIdAndOnibusIdAndNumero(pv.getViagem().getId(), onibusId, numero)
                .orElseGet(() -> {
                    Assento a = new Assento(); a.setViagem(pv.getViagem()); a.setOnibus(onibusRepository.findById(onibusId).orElseThrow()); a.setNumero(numero); a.setOcupado(false);
                    return assentoRepository.save(a);
                });

        if(assento.isOcupado() && !assento.equals(pv.getAssento())) throw new RuntimeException("Ocupado");

        if(pv.getAssento() != null) { Assento old = pv.getAssento(); old.setOcupado(false); old.setPassageiroViagem(null); assentoRepository.save(old); }
        assento.setOcupado(true); assento.setPassageiroViagem(pv); pv.setAssento(assento);
        assentoRepository.save(assento);
        return new PassengerResponseDto(repository.save(pv));
    }

    // --- HELPER METHODS ---
    private void atualizarCamposComuns(PassageiroViagem pv, PassengerSaveRequestDto dto) {
        if(dto.enderecoColetaId()!=null) pv.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(null));
        if(dto.enderecoEntregaId()!=null) pv.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(null));
        pv.setTaxistaColeta(dto.taxistaColetaId()!=null ? taxistaRepository.findById(dto.taxistaColetaId()).orElse(null) : null);
        pv.setTaxistaEntrega(dto.taxistaEntregaId()!=null ? taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null) : null);
        pv.setComisseiro(dto.comisseiroId()!=null ? comisseiroRepository.findById(dto.comisseiroId()).orElse(null) : null);
        pv.setValor(dto.valor());
        pv.setMetodoPagamento(dto.metodoPagamento());
        if(dto.pago()!=null) pv.setPago(dto.pago());
    }

    private void vincularAssentoExistente(PassageiroViagem pv, Long assentoId) {
        Assento a = assentoRepository.findById(assentoId).orElse(null);
        if(a != null && !a.isOcupado()) {
            if(pv.getAssento()!=null) { Assento old = pv.getAssento(); old.setOcupado(false); old.setPassageiroViagem(null); assentoRepository.save(old); }
            a.setOcupado(true); a.setPassageiroViagem(pv); pv.setAssento(a); assentoRepository.save(a);
        }
    }

    private void vincularAssentoString(PassageiroViagem pv, String num) {
        try {
            if(!pv.getViagem().getListaOnibus().isEmpty()) vincularAssentoPorNumero(pv.getId(), pv.getViagem().getListaOnibus().get(0).getIdOnibus(), num);
        } catch(Exception e) {}
    }

    private Endereco resolverEndereco(EnderecoDto dto) {
        if(dto == null) return null;
        if(dto.id() != null) return enderecoRepository.findById(dto.id()).orElse(null);
        if(dto.logradouro() != null) {
            Endereco e = new Endereco(); e.setLogradouro(dto.logradouro()); e.setBairro(dto.bairro()); e.setCidade(dto.cidade()); e.setNumero(dto.numero()); e.setEstado(dto.estado());
            return enderecoRepository.save(e);
        }
        return null;
    }

    private Pessoa resolverPessoa(FamilyMemberDto dto) {
        if(dto.pessoaId() != null) return pessoaRepository.findById(dto.pessoaId()).map(p -> {
            p.setNome(dto.nome()); p.setCpf(dto.cpf()); p.setTelefone(dto.telefone()); return pessoaRepository.save(p);
        }).orElseGet(() -> criarPessoa(dto));
        return criarPessoa(dto);
    }

    private Pessoa criarPessoa(FamilyMemberDto dto) {
        if(dto.cpf()!=null && !dto.cpf().isEmpty()) { Optional<Pessoa> p = pessoaRepository.findByCpf(dto.cpf()); if(p.isPresent()) return p.get(); }
        Pessoa p = new Pessoa(); p.setNome(dto.nome()); p.setCpf(dto.cpf()); p.setTelefone(dto.telefone()); return pessoaRepository.save(p);
    }
}