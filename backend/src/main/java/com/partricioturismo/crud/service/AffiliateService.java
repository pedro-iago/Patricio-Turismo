package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.AffiliateDto;
import com.partricioturismo.crud.dtos.AffiliateResponseDto;
import com.partricioturismo.crud.dtos.CreateAffiliateRequestDto;
import com.partricioturismo.crud.model.Comisseiro;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.model.Taxista;
import com.partricioturismo.crud.repositories.ComisseiroRepository;
import com.partricioturismo.crud.repositories.PessoaRepository;
import com.partricioturismo.crud.repositories.TaxistaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// --- IMPORTS NOVOS ---
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class AffiliateService {

    @Autowired
    private TaxistaRepository taxistaRepository;

    @Autowired
    private ComisseiroRepository comisseiroRepository;

    @Autowired
    private PessoaRepository pessoaRepository;

    // --- Lógica de Taxista ---

    // --- MÉTODO ATUALIZADO (Passo 4) ---
    public Page<AffiliateResponseDto> getAllTaxistas(Pageable pageable) {
        Page<Taxista> paginaTaxista = taxistaRepository.findAll(pageable);
        // Converte a Page<Taxista> para Page<AffiliateResponseDto>
        return paginaTaxista.map(AffiliateResponseDto::new);
    }

    @Transactional
    public AffiliateDto createTaxista(CreateAffiliateRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.getPessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        Taxista taxista = new Taxista();
        taxista.setPessoa(pessoa);
        taxistaRepository.save(taxista);

        // Retorna o DTO antigo (AffiliateDto), pois o DTO de resposta é usado apenas para listagem/detalhes
        return new AffiliateDto(taxista.getId(), new AffiliateResponseDto(taxista).pessoa());
    }

    @Transactional
    public void deleteTaxista(Long id) {
        if (!taxistaRepository.existsById(id)) {
            throw new EntityNotFoundException("Taxista não encontrado");
        }
        taxistaRepository.deleteById(id);
    }

    // --- Lógica de Comisseiro ---

    // --- MÉTODO ATUALIZADO (Passo 4) ---
    public Page<AffiliateResponseDto> getAllComisseiros(Pageable pageable) {
        Page<Comisseiro> paginaComisseiro = comisseiroRepository.findAll(pageable);
        return paginaComisseiro.map(AffiliateResponseDto::new);
    }

    @Transactional
    public AffiliateDto createComisseiro(CreateAffiliateRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.getPessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        Comisseiro comisseiro = new Comisseiro();
        comisseiro.setPessoa(pessoa);
        comisseiroRepository.save(comisseiro);

        return new AffiliateDto(comisseiro.getId(), new AffiliateResponseDto(comisseiro).pessoa());
    }

    @Transactional
    public void deleteComisseiro(Long id) {
        if (!comisseiroRepository.existsById(id)) {
            throw new EntityNotFoundException("Comisseiro não encontrado");
        }
        comisseiroRepository.deleteById(id);
    }
}