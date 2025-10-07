package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.repositories.ViagemRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.batch.BatchTransactionManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/viagem")
public class ViagemController {

    @Autowired
    ViagemRepository repository;

    @GetMapping
    public ResponseEntity getAll() {
        List<Viagem> listViagam = repository.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(listViagam);
    }

    @GetMapping("/{idViagem}")
    public ResponseEntity getById(@PathVariable(value = "idViagem") Integer idViagem) {
        Optional viagem = repository.findById(idViagem);
        if (viagem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("viagem não existente");
        }
        return ResponseEntity.status(HttpStatus.FOUND).body(viagem.get());
    }

    @PostMapping
    public ResponseEntity save(@RequestBody ViagemDto viagemDto) {
        var viagem = new Viagem();
        BeanUtils.copyProperties(viagemDto, viagem);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(viagem));
    }

    @DeleteMapping("/{idViagem}")
    public ResponseEntity delete(@PathVariable(value = "idViagem") Integer idViagem) {
        Optional<Viagem> viagem = repository.findById(idViagem);
        if (viagem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
        }
        repository.delete(viagem.get());
        return ResponseEntity.status(HttpStatus.OK).body("Viagem deletado");
    }

    @PutMapping("/{idViagem}")
    public ResponseEntity update(@PathVariable(value = "idViagem") Integer idViagem, @RequestBody ViagemDto viagemDto) {
        Optional<Viagem> viagem = repository.findById(idViagem);
        if (viagem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
        }
        var viagemModel = viagem.get();
        BeanUtils.copyProperties(viagemDto, viagemModel);
        return ResponseEntity.status(HttpStatus.OK).body(repository.save(viagemModel));
    }
}
