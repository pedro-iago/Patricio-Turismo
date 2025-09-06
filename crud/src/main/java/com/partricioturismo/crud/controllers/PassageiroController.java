package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.PassageiroDto;
import com.partricioturismo.crud.model.Passageiro;
import com.partricioturismo.crud.repositories.PassageiroRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/passageiro")
public class PassageiroController {

    @Autowired
    PassageiroRepository repository;

    @GetMapping
    public ResponseEntity getAll() {
        List<Passageiro> listPassageiro = repository.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(listPassageiro);
    }

    @GetMapping("/{idPassageiro}")
    public ResponseEntity getById(@PathVariable(value = "idPassageiro") Integer idPassageiro) {
        Optional passageiro = repository.findById(idPassageiro);
        if (passageiro.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Passageiro não existente");

        }
        return ResponseEntity.status(HttpStatus.FOUND).body(passageiro.get());
    }

    @PostMapping
    public ResponseEntity save(@RequestBody PassageiroDto passageiroDto) {
        var passageiro = new Passageiro();
        BeanUtils.copyProperties(passageiroDto, passageiro);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(passageiro));
    }

    @DeleteMapping("/{idPassageiro}")
    public ResponseEntity delete(@PathVariable(value = "idPassageiro") Integer idPassageiro) {
        Optional<Passageiro> passageiro = repository.findById(idPassageiro);
        if (passageiro.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Passageiro não existente");
        }
        repository.delete(passageiro.get());
        return ResponseEntity.status(HttpStatus.OK).body("Passageiro deletado");
    }

    @PutMapping("/{idPassageiro}")
    public ResponseEntity update(@PathVariable(value = "idPassageiro") Integer idPassageiro, @RequestBody PassageiroDto passageiroDto) {
        Optional<Passageiro> passageiro = repository.findById(idPassageiro);
        if (passageiro.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Passageiro não existente");
        }
        var passageiroModel = passageiro.get();
        BeanUtils.copyProperties(passageiroDto, passageiroModel);
        return ResponseEntity.status(HttpStatus.OK).body(repository.save(passageiroModel));
    }
}
