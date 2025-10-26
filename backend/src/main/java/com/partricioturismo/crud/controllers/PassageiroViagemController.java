package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.PassageiroViagemDto;
import com.partricioturismo.crud.model.PassageiroViagem;
import com.partricioturismo.crud.service.PassageiroViagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/passageiroviagem") // Endpoint
public class PassageiroViagemController {

    @Autowired
    PassageiroViagemService service;

    @GetMapping
    public ResponseEntity<List<PassageiroViagem>> getAll() {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll());
    }

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassageiroViagem>> getByViagemId(@PathVariable Long viagemId) {
        List<PassageiroViagem> passageiros = service.findByViagemId(viagemId);
        return ResponseEntity.status(HttpStatus.OK).body(passageiros);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable(value = "id") Long id) {
        Optional<PassageiroViagem> pv = service.findById(id);
        if (pv.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
        }
        return ResponseEntity.status(HttpStatus.OK).body(pv.get());
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody PassageiroViagemDto dto) {
        try {
            var pvSalvo = service.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(pvSalvo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable(value = "id") Long id) {
        boolean deletado = service.delete(id);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Registro deletado com sucesso");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable(value = "id") Long id, @RequestBody PassageiroViagemDto dto) {
        try {
            Optional<PassageiroViagem> pvAtualizado = service.update(id, dto);
            if (pvAtualizado.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
            }
            return ResponseEntity.status(HttpStatus.OK).body(pvAtualizado.get());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}