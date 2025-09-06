package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.dtos.PassageiroDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.model.Passageiro;
import com.partricioturismo.crud.repositories.OnibusRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/onibus")
public class OnibusController {

    @Autowired
    OnibusRepository repository;

    @GetMapping
    public ResponseEntity getAll() {
        List<Onibus> listOnibus = repository.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(listOnibus);
    }

    @GetMapping("/{idOnibus}")
    public ResponseEntity getById(@PathVariable(value = "idOnibus") Integer idOnibus) {
        Optional onibus = repository.findById(idOnibus);
        if (onibus.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");

        }
        return ResponseEntity.status(HttpStatus.FOUND).body(onibus.get());
    }

    @PostMapping
    public ResponseEntity save(@RequestBody OnibusDto onibusDto) {
        var onibus = new Onibus();
        BeanUtils.copyProperties(onibusDto, onibus);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(onibus));
    }

    @DeleteMapping("/{idOnibus}")
    public ResponseEntity delete(@PathVariable(value = "idOnibus") Integer idOnibus) {
        Optional<Onibus> onibus = repository.findById(idOnibus);
        if (onibus.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");
        }
        repository.delete(onibus.get());
        return ResponseEntity.status(HttpStatus.OK).body("Onibus deletado");
    }

    @PutMapping("/{idOnibus}")
    public ResponseEntity update(@PathVariable(value = "idOnibus") Integer idOnibus, @RequestBody OnibusDto onibusDto) {
        Optional<Onibus> onibus = repository.findById(idOnibus);
        if (onibus.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Passageiro não existente");
        }
        var onibusModel = onibus.get();
        BeanUtils.copyProperties(onibusDto, onibusModel);
        return ResponseEntity.status(HttpStatus.OK).body(repository.save(onibusModel));
    }
}
