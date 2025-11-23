package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.EncomendaSaveRequestDto;
import com.partricioturismo.crud.dtos.EncomendaResponseDto;
import com.partricioturismo.crud.model.*;
import com.partricioturismo.crud.repositories.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EncomendaService {

    @Autowired private EncomendaRepository repository;
    @Autowired private ViagemRepository viagemRepository;
    @Autowired private PessoaRepository pessoaRepository;
    @Autowired private EnderecoRepository enderecoRepository;
    @Autowired private TaxistaRepository taxistaRepository;
    @Autowired private ComisseiroRepository comisseiroRepository;

    // === NOVO MÉTODO: ATRIBUIR TAXISTA EM MASSA ===
    @Transactional
    public void atribuirTaxistaEmMassa(List<Long> ids, Long taxistaId, String tipo) {
        if (ids == null || ids.isEmpty()) return;

        // Busca o taxista (pode ser null se for para desvincular)
        Taxista taxista = null;
        if (taxistaId != null) {
            taxista = taxistaRepository.findById(taxistaId)
                    .orElseThrow(() -> new EntityNotFoundException("Taxista não encontrado"));
        }

        List<Encomenda> lista = repository.findAllById(ids);

        for (Encomenda enc : lista) {
            if ("COLETA".equalsIgnoreCase(tipo)) {
                enc.setTaxistaColeta(taxista);
            } else if ("ENTREGA".equalsIgnoreCase(tipo)) {
                enc.setTaxistaEntrega(taxista);
            }
            repository.save(enc);
        }
    }
    // ==============================================

    // --- NOVO MÉTODO: ATUALIZAR COR (V11) ---
    @Transactional
    public EncomendaResponseDto updateCor(Long id, String cor) {
        Encomenda encomenda = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Encomenda não encontrada"));
        encomenda.setCorTag(cor);
        return convertToDto(repository.save(encomenda));
    }

    // ... (Restante dos métodos findAll, findById, save, update, delete mantidos iguais) ...

    @Transactional(readOnly = true)
    public List<EncomendaResponseDto> findAll() {
        return repository.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EncomendaResponseDto> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId).stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EncomendaResponseDto> findById(Long id) {
        return repository.findById(id).map(this::convertToDto);
    }

    @Transactional
    public EncomendaResponseDto save(EncomendaSaveRequestDto dto) {
        Encomenda encomenda = new Encomenda();
        BeanUtils.copyProperties(dto, encomenda);
        encomenda = carregarEntidades(encomenda, dto);
        return convertToDto(repository.save(encomenda));
    }

    @Transactional
    public Optional<EncomendaResponseDto> update(Long id, EncomendaSaveRequestDto dto) {
        Optional<Encomenda> op = repository.findById(id);
        if(op.isEmpty()) return Optional.empty();
        Encomenda enc = op.get();
        BeanUtils.copyProperties(dto, enc, "id");
        enc = carregarEntidades(enc, dto);
        return Optional.of(convertToDto(repository.save(enc)));
    }

    @Transactional
    public boolean delete(Long id) {
        if(!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }

    @Transactional
    public Optional<EncomendaResponseDto> markAsPaid(Long id) {
        return repository.findById(id).map(e -> {
            e.setPago(true);
            return convertToDto(repository.save(e));
        });
    }

    private Encomenda carregarEntidades(Encomenda encomenda, EncomendaSaveRequestDto dto) {
        Viagem viagem = viagemRepository.findById(dto.viagemId()).orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada!"));
        Pessoa remetente = pessoaRepository.findById(dto.remetenteId()).orElseThrow(() -> new EntityNotFoundException("Remetente não encontrado!"));
        Pessoa destinatario = pessoaRepository.findById(dto.destinatarioId()).orElseThrow(() -> new EntityNotFoundException("Destinatário não encontrado!"));

        encomenda.setViagem(viagem);
        encomenda.setRemetente(remetente);
        encomenda.setDestinatario(destinatario);

        if(dto.enderecoColetaId() != null) encomenda.setEnderecoColeta(enderecoRepository.findById(dto.enderecoColetaId()).orElse(null));
        if(dto.enderecoEntregaId() != null) encomenda.setEnderecoEntrega(enderecoRepository.findById(dto.enderecoEntregaId()).orElse(null));

        encomenda.setValor(dto.valor());
        encomenda.setMetodoPagamento(dto.metodoPagamento());
        if (dto.pago() != null) encomenda.setPago(dto.pago());

        // Mapear taxistas/comisseiros se vierem no DTO de save/update
        if (dto.taxistaColetaId() != null) encomenda.setTaxistaColeta(taxistaRepository.findById(dto.taxistaColetaId()).orElse(null));
        if (dto.taxistaEntregaId() != null) encomenda.setTaxistaEntrega(taxistaRepository.findById(dto.taxistaEntregaId()).orElse(null));
        if (dto.comisseiroId() != null) encomenda.setComisseiro(comisseiroRepository.findById(dto.comisseiroId()).orElse(null));

        return encomenda;
    }

    private EncomendaResponseDto convertToDto(Encomenda e) {
        return new EncomendaResponseDto(e);
    }
}