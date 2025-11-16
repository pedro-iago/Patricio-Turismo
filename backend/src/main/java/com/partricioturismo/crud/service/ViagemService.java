package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.dtos.ViagemSaveRequestDto;
import com.partricioturismo.crud.model.Assento;
import com.partricioturismo.crud.model.Encomenda; // <-- IMPORT NECESSÁRIO
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.PassageiroViagem; // <-- IMPORT NECESSÁRIO
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.AssentoRepository;
import com.partricioturismo.crud.repositories.EncomendaRepository; // <-- IMPORT NECESSÁRIO
import com.partricioturismo.crud.repositories.OnibusRepository;
import com.partricioturismo.crud.repositories.PassageiroViagemRepository; // <-- IMPORT NECESSÁRIO
import com.partricioturismo.crud.repositories.ViagemRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // --- MUDANÇA: Injeções necessárias para o DELETE em cascata ---
    @Autowired
    private PassageiroViagemService passageiroViagemService; // Usa o Service para a lógica de delete complexa

    @Autowired
    private PassageiroViagemRepository passageiroViagemRepository; // Usa o Repo para BUSCAR

    @Autowired
    private EncomendaRepository encomendaRepository; // Usa o Repo para BUSCAR e DELETAR
    // --- FIM DA MUDANÇA ---


    @Transactional
    public ViagemDto save(ViagemSaveRequestDto viagemDto) {
        Onibus onibus = onibusRepository.findById(viagemDto.onibusId())
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado!"));

        var viagem = new Viagem();
        BeanUtils.copyProperties(viagemDto, viagem);
        viagem.setOnibus(onibus);
        var viagemSalva = viagemRepository.save(viagem);

        // --- LÓGICA CORRIGIDA: CRIA ASSENTOS COM BOOLEAN ---
        int capacidade = onibus.getCapacidadePassageiros();
        List<Assento> novosAssentos = new ArrayList<>();
        for (int i = 1; i <= capacidade; i++) {
            Assento assento = new Assento();
            assento.setNumero(String.valueOf(i));
            assento.setOcupado(false);
            assento.setViagem(viagemSalva);
            novosAssentos.add(assento);
        }
        assentoRepository.saveAll(novosAssentos);

        return toDto(viagemSalva);
    }

    public ViagemDto toDto(Viagem viagem) {
        return new ViagemDto(
                viagem.getId(),
                viagem.getDataHoraPartida(),
                viagem.getDataHoraChegada(),
                viagem.getOnibus().getIdOnibus()
        );
    }

    public Page<ViagemDto> findAll(Pageable pageable) {
        return viagemRepository.findAll(pageable).map(this::toDto);
    }

    public Optional<ViagemDto> findById(Long id) {
        return viagemRepository.findById(id).map(this::toDto);
    }

    @Transactional
    public Optional<ViagemDto> update(Long id, ViagemSaveRequestDto viagemDto) {
        Optional<Viagem> viagemOptional = viagemRepository.findById(id);
        if (viagemOptional.isEmpty()) { return Optional.empty(); }

        Onibus onibus = onibusRepository.findById(viagemDto.onibusId())
                .orElseThrow(() -> new RuntimeException("Ônibus não encontrado!"));

        var viagemModel = viagemOptional.get();
        BeanUtils.copyProperties(viagemDto, viagemModel, "id");
        viagemModel.setOnibus(onibus);

        var viagemAtualizada = viagemRepository.save(viagemModel);
        return Optional.of(toDto(viagemAtualizada));
    }

    // --- MUDANÇA: Lógica de DELETE corrigida ---
    @Transactional
    public boolean delete(Long id) {
        // 1. Verifica se a viagem existe
        if (!viagemRepository.existsById(id)) {
            return false;
        }

        // 2. Deletar todos os Passageiros (e suas Bagagens)
        // Usamos o Service, pois ele tem a lógica de deletar Bagagens e liberar Assentos
        List<PassageiroViagem> passageiros = passageiroViagemRepository.findByViagemId(id);
        for (PassageiroViagem p : passageiros) {
            passageiroViagemService.delete(p.getId());
        }

        // 3. Deletar todas as Encomendas
        // (Encomenda não tem filhos, então podemos usar o repository)
        List<Encomenda> encomendas = encomendaRepository.findByViagemId(id);
        if (!encomendas.isEmpty()) {
            encomendaRepository.deleteAll(encomendas);
        }

        // 4. Deletar a Viagem "pai"
        // O `cascade = CascadeType.ALL` na sua entidade Viagem
        // cuidará de deletar todos os Assentos automaticamente.
        viagemRepository.deleteById(id);
        return true;
    }
    // --- FIM DA MUDANÇA ---
}