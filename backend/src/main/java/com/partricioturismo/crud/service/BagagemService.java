package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.BagagemDto;
import com.partricioturismo.crud.model.Bagagem;
import com.partricioturismo.crud.model.PassageiroViagem;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.repositories.BagagemRepository;
import com.partricioturismo.crud.repositories.PassageiroViagemRepository;
import com.partricioturismo.crud.repositories.PessoaRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BagagemService {

    @Autowired
    private BagagemRepository repository;
    @Autowired
    private PessoaRepository pessoaRepository;
    @Autowired
    private PassageiroViagemRepository passageiroViagemRepository;

    public List<Bagagem> findAll() {
        return repository.findAll();
    }

    public List<Bagagem> findByPassageiroViagemId(Long passageiroViagemId) {
        return repository.findByPassageiroViagemId(passageiroViagemId);
    }

    public Optional<Bagagem> findById(Long id) {
        return repository.findById(id);
    }

    // Método auxiliar para carregar as entidades
    private Bagagem carregarEntidades(Bagagem bagagem, BagagemDto dto) {
        // 1. Busca Responsável (obrigatório)
        Pessoa responsavel = pessoaRepository.findById(dto.responsavelId())
                .orElseThrow(() -> new RuntimeException("Responsável (Pessoa) não encontrado!"));
        bagagem.setResponsavel(responsavel);

        // 2. Busca PassageiroViagem (opcional)
        if (dto.passageiroViagemId() != null) {
            PassageiroViagem pv = passageiroViagemRepository.findById(dto.passageiroViagemId())
                    .orElseThrow(() -> new RuntimeException("PassageiroViagem não encontrado!"));
            bagagem.setPassageiroViagem(pv);
        } else {
            bagagem.setPassageiroViagem(null);
        }

        return bagagem;
    }

    @Transactional
    public Bagagem save(BagagemDto dto) {
        Bagagem bagagem = new Bagagem();
        BeanUtils.copyProperties(dto, bagagem); // Copia peso e descricao
        bagagem = carregarEntidades(bagagem, dto); // Busca e seta as entidades
        return repository.save(bagagem);
    }

    @Transactional
    public Optional<Bagagem> update(Long id, BagagemDto dto) {
        Optional<Bagagem> optionalBagagem = repository.findById(id);
        if (optionalBagagem.isEmpty()) {
            return Optional.empty();
        }

        Bagagem bagagemModel = optionalBagagem.get();
        BeanUtils.copyProperties(dto, bagagemModel, "id"); // Copia peso e descricao
        bagagemModel = carregarEntidades(bagagemModel, dto); // Atualiza as entidades
        return Optional.of(repository.save(bagagemModel));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Bagagem> optionalBagagem = repository.findById(id);
        if (optionalBagagem.isEmpty()) {
            return false;
        }
        repository.delete(optionalBagagem.get());
        return true;
    }
}
