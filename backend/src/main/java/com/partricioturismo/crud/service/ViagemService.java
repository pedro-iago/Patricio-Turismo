package com.partricioturismo.crud.service;

import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.dtos.ViagemSaveRequestDto;
import com.partricioturismo.crud.model.Assento;
// import com.partricioturismo.crud.model.AssentoStatus; // <-- REMOVIDO
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.AssentoRepository;
import com.partricioturismo.crud.repositories.OnibusRepository;
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
    // ... (injeções) ...

    // ... (método toDto, findAll, findById, update, delete permanecem iguais) ...

    @Autowired
    private ViagemRepository viagemRepository;
    @Autowired
    private OnibusRepository onibusRepository;
    @Autowired
    private AssentoRepository assentoRepository;

    // (Resto do service, incluindo toDto, findById, findAll, update, delete)

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
            assento.setOcupado(false); // <-- MUDANÇA: Agora é FALSE (Livre)
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
        // ... (lógica de update permanece a mesma) ...
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

    @Transactional
    public boolean delete(Long id) {
        Optional<Viagem> viagemOptional = viagemRepository.findById(id);
        if (viagemOptional.isEmpty()) { return false; }
        viagemRepository.delete(viagemOptional.get());
        return true;
    }
}