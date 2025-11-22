package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.dtos.ViagemSaveRequestDto;
import com.partricioturismo.crud.model.Assento;
import com.partricioturismo.crud.model.Encomenda;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.PassageiroViagem;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.AssentoRepository;
import com.partricioturismo.crud.repositories.EncomendaRepository;
import com.partricioturismo.crud.repositories.OnibusRepository;
import com.partricioturismo.crud.repositories.PassageiroViagemRepository;
import com.partricioturismo.crud.repositories.ViagemRepository;
import com.partricioturismo.crud.service.ViagemSpecs; // <--- IMPORTANTE
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification; // <--- IMPORTANTE
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ViagemService {

    @Autowired
    private ViagemRepository viagemRepository;
    @Autowired
    private OnibusRepository onibusRepository;
    @Autowired
    private AssentoRepository assentoRepository;

    @Autowired
    private PassageiroViagemService passageiroViagemService;
    @Autowired
    private PassageiroViagemRepository passageiroViagemRepository;
    @Autowired
    private EncomendaRepository encomendaRepository;

    // === MÉTODO ATUALIZADO: USA SPECIFICATIONS ===
    @Transactional(readOnly = true)
    public Page<ViagemDto> findAll(Integer mes, Integer ano, String query, Pageable pageable) {

        // 1. Cria a especificação (filtro) usando a classe auxiliar ViagemSpecs
        // Isso trata nulos e tipos de dados (Integer/Double) automaticamente
        Specification<Viagem> spec = ViagemSpecs.comFiltros(mes, ano, query);

        // 2. Chama o repositório passando a Spec + Paginação
        // O Spring gera o SQL correto para o seu banco (PostgreSQL)
        return viagemRepository.findAll(spec, pageable)
                .map(this::toDto);
    }
    // =============================================

    @Transactional(readOnly = true)
    public ViagemDto findById(Long id) {
        Viagem v = viagemRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada"));
        return toDto(v);
    }

    @Transactional
    public ViagemDto save(ViagemSaveRequestDto viagemDto) {
        Viagem viagem = new Viagem();
        viagem.setDataHoraPartida(viagemDto.dataHoraPartida());
        viagem.setDataHoraChegada(viagemDto.dataHoraChegada());

        List<Onibus> onibusList = new ArrayList<>();
        if (viagemDto.onibusIds() != null && !viagemDto.onibusIds().isEmpty()) {
            onibusList = onibusRepository.findAllById(viagemDto.onibusIds());
            viagem.setListaOnibus(onibusList);
        }

        var viagemSalva = viagemRepository.save(viagem);

        // Cria assentos automaticamente para cada ônibus
        List<Assento> novosAssentos = new ArrayList<>();
        for (Onibus onibus : onibusList) {
            int capacidade = onibus.getCapacidadePassageiros();
            for (int i = 1; i <= capacidade; i++) {
                Assento assento = new Assento();
                assento.setNumero(String.valueOf(i));
                assento.setOcupado(false);
                assento.setViagem(viagemSalva);
                assento.setOnibus(onibus);
                novosAssentos.add(assento);
            }
        }
        assentoRepository.saveAll(novosAssentos);

        return toDto(viagemSalva);
    }

    public ViagemDto toDto(Viagem viagem) {
        List<OnibusDto> onibusDtos = new ArrayList<>();

        if (viagem.getListaOnibus() != null) {
            onibusDtos = viagem.getListaOnibus().stream()
                    .map(o -> new OnibusDto(
                            o.getIdOnibus(),
                            o.getModelo(),
                            o.getPlaca(),
                            o.getCapacidadePassageiros(),
                            o.getLayoutJson()))
                    .collect(Collectors.toList());
        }

        return new ViagemDto(
                viagem.getId(),
                viagem.getDataHoraPartida(),
                viagem.getDataHoraChegada(),
                onibusDtos
        );
    }

    @Transactional
    public Optional<ViagemDto> update(Long id, ViagemSaveRequestDto viagemDto) {
        Optional<Viagem> viagemOptional = viagemRepository.findById(id);
        if (viagemOptional.isEmpty()) { return Optional.empty(); }

        var viagemModel = viagemOptional.get();
        viagemModel.setDataHoraPartida(viagemDto.dataHoraPartida());
        viagemModel.setDataHoraChegada(viagemDto.dataHoraChegada());

        if (viagemDto.onibusIds() != null) {
            List<Onibus> onibusList = onibusRepository.findAllById(viagemDto.onibusIds());
            viagemModel.setListaOnibus(onibusList);
        }

        var viagemAtualizada = viagemRepository.save(viagemModel);
        return Optional.of(toDto(viagemAtualizada));
    }

    @Transactional
    public boolean delete(Long id) {
        if (!viagemRepository.existsById(id)) {
            return false;
        }
        List<PassageiroViagem> passageiros = passageiroViagemRepository.findByViagemId(id);
        for (PassageiroViagem p : passageiros) {
            passageiroViagemService.delete(p.getId());
        }
        List<Encomenda> encomendas = encomendaRepository.findByViagemId(id);
        if (!encomendas.isEmpty()) {
            encomendaRepository.deleteAll(encomendas);
        }
        viagemRepository.deleteById(id);
        return true;
    }
}