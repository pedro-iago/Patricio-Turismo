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

    public Page<AffiliateResponseDto> getAllTaxistas(Pageable pageable) {
        Page<Taxista> paginaTaxista = taxistaRepository.findAll(pageable);
        return paginaTaxista.map(AffiliateResponseDto::new);
    }

    // ✅ NOVO MÉTODO: Buscar Taxista por ID
    public AffiliateResponseDto getTaxistaById(Long id) {
        Taxista taxista = taxistaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Taxista não encontrado com id: " + id));
        return new AffiliateResponseDto(taxista);
    }

    @Transactional
    public AffiliateDto createTaxista(CreateAffiliateRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.getPessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        // Verifica se já existe para evitar duplicação (opcional, mas recomendado)
        if (taxistaRepository.existsByPessoaId(dto.getPessoaId())) {
            throw new IllegalArgumentException("Esta pessoa já está cadastrada como taxista.");
        }

        Taxista taxista = new Taxista();
        taxista.setPessoa(pessoa);
        taxistaRepository.save(taxista);

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

    public Page<AffiliateResponseDto> getAllComisseiros(Pageable pageable) {
        Page<Comisseiro> paginaComisseiro = comisseiroRepository.findAll(pageable);
        return paginaComisseiro.map(AffiliateResponseDto::new);
    }

    // ✅ NOVO MÉTODO: Buscar Comisseiro por ID
    public AffiliateResponseDto getComisseiroById(Long id) {
        Comisseiro comisseiro = comisseiroRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comisseiro não encontrado com id: " + id));
        return new AffiliateResponseDto(comisseiro);
    }

    @Transactional
    public AffiliateDto createComisseiro(CreateAffiliateRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.getPessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada"));

        if (comisseiroRepository.existsByPessoaId(dto.getPessoaId())) {
            throw new IllegalArgumentException("Esta pessoa já está cadastrada como comisseiro.");
        }

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