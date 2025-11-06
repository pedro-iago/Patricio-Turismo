package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.AffiliateDto;
import com.partricioturismo.crud.dtos.CreateAffiliateRequestDto;
import com.partricioturismo.crud.dtos.PessoaDto;
import com.partricioturismo.crud.model.Comisseiro;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.model.Taxista;
import com.partricioturismo.crud.repositories.ComisseiroRepository;
import com.partricioturismo.crud.repositories.PessoaRepository;
import com.partricioturismo.crud.repositories.TaxistaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AffiliateService {

    @Autowired
    private TaxistaRepository taxistaRepository;

    @Autowired
    private ComisseiroRepository comisseiroRepository;

    @Autowired
    private PessoaRepository pessoaRepository; // Para buscar a Pessoa

    // --- MÉTODOS DE TAXISTA ---

    @Transactional(readOnly = true)
    public List<AffiliateDto> getAllTaxistas() {
        return taxistaRepository.findAll().stream()
                .map(this::convertTaxistaToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AffiliateDto createTaxista(CreateAffiliateRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.getPessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada com ID: " + dto.getPessoaId()));

        Taxista newTaxista = new Taxista(pessoa);
        Taxista savedTaxista = taxistaRepository.save(newTaxista);
        return convertTaxistaToDto(savedTaxista);
    }

    public void deleteTaxista(Long id) {
        taxistaRepository.deleteById(id);
    }

    // --- MÉTODOS DE COMISSEIRO ---

    @Transactional(readOnly = true)
    public List<AffiliateDto> getAllComisseiros() {
        return comisseiroRepository.findAll().stream()
                .map(this::convertComisseiroToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AffiliateDto createComisseiro(CreateAffiliateRequestDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.getPessoaId())
                .orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada com ID: " + dto.getPessoaId()));

        Comisseiro newComisseiro = new Comisseiro(pessoa);
        Comisseiro savedComisseiro = comisseiroRepository.save(newComisseiro);
        return convertComisseiroToDto(savedComisseiro);
    }

    public void deleteComisseiro(Long id) {
        comisseiroRepository.deleteById(id);
    }

    // --- MÉTODOS PRIVADOS DE CONVERSÃO (CORRIGIDOS) ---

    /**
     * Converte uma entidade Taxista em um AffiliateDto.
     * A conversão é feita manualmente para se alinhar ao construtor
     * de 5 argumentos do PessoaDto.
     */
    private AffiliateDto convertTaxistaToDto(Taxista taxista) {
        // Pega a entidade Pessoa de dentro do Taxista
        Pessoa p = taxista.getPessoa();

        // CORREÇÃO: Chama o construtor de PessoaDto com os 5 argumentos
        // (Baseado na sua tabela V1: id, nome, cpf, telefone, idade)
        PessoaDto pessoaDto = new PessoaDto(p.getId(), p.getNome(), p.getCpf(), p.getTelefone(), p.getIdade());

        return new AffiliateDto(taxista.getId(), pessoaDto);
    }

    /**
     * Converte uma entidade Comisseiro em um AffiliateDto.
     * Mesma lógica do método acima.
     */
    private AffiliateDto convertComisseiroToDto(Comisseiro comisseiro) {
        // Pega a entidade Pessoa de dentro do Comisseiro
        Pessoa p = comisseiro.getPessoa();

        // CORREÇÃO: Chama o construtor de PessoaDto com os 5 argumentos
        PessoaDto pessoaDto = new PessoaDto(p.getId(), p.getNome(), p.getCpf(), p.getTelefone(), p.getIdade());

        return new AffiliateDto(comisseiro.getId(), pessoaDto);
    }
}