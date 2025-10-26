package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.PassageiroViagemDto;
import com.partricioturismo.crud.model.Endereco;
import com.partricioturismo.crud.model.PassageiroViagem;
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.EnderecoRepository;
import com.partricioturismo.crud.repositories.PassageiroViagemRepository;
import com.partricioturismo.crud.repositories.PessoaRepository;
import com.partricioturismo.crud.repositories.ViagemRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PassageiroViagemService {

    // Injetando os 4 repositórios necessários
    @Autowired
    private PassageiroViagemRepository repository;
    @Autowired
    private PessoaRepository pessoaRepository;
    @Autowired
    private ViagemRepository viagemRepository;
    @Autowired
    private EnderecoRepository enderecoRepository;


    public List<PassageiroViagem> findAll() {
        return repository.findAll();
    }

    public List<PassageiroViagem> findByViagemId(Long viagemId) {
        return repository.findByViagemId(viagemId);
    }

    public Optional<PassageiroViagem> findById(Long id) {
        return repository.findById(id);
    }

    // Método auxiliar para buscar todas as entidades
    private PassageiroViagem carregarEntidades(PassageiroViagem pv, PassageiroViagemDto dto) {
        Pessoa pessoa = pessoaRepository.findById(dto.pessoaId())
                .orElseThrow(() -> new RuntimeException("Pessoa não encontrada!"));
        Viagem viagem = viagemRepository.findById(dto.viagemId())
                .orElseThrow(() -> new RuntimeException("Viagem não encontrada!"));
        Endereco coleta = enderecoRepository.findById(dto.enderecoColetaId())
                .orElseThrow(() -> new RuntimeException("Endereço de Coleta não encontrado!"));
        Endereco entrega = enderecoRepository.findById(dto.enderecoEntregaId())
                .orElseThrow(() -> new RuntimeException("Endereço de Entrega não encontrado!"));

        pv.setPessoa(pessoa);
        pv.setViagem(viagem);
        pv.setEnderecoColeta(coleta);
        pv.setEnderecoEntrega(entrega);
        return pv;
    }

    @Transactional
    public PassageiroViagem save(PassageiroViagemDto dto) {
        PassageiroViagem pv = new PassageiroViagem();
        pv = carregarEntidades(pv, dto); // Busca e seta as entidades
        return repository.save(pv);
    }

    @Transactional
    public Optional<PassageiroViagem> update(Long id, PassageiroViagemDto dto) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return Optional.empty();
        }

        PassageiroViagem pvModel = pvOptional.get();
        pvModel = carregarEntidades(pvModel, dto); // Busca e atualiza as entidades
        return Optional.of(repository.save(pvModel));
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<PassageiroViagem> pvOptional = repository.findById(id);
        if (pvOptional.isEmpty()) {
            return false;
        }
        repository.delete(pvOptional.get());
        return true;
    }
}