package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.BagagemDto;
import com.partricioturismo.crud.service.BagagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bagagem") // <-- MUDANÇA AQUI
public class BagagemController {

    @Autowired
    BagagemService service;

    @GetMapping
    public ResponseEntity<List<BagagemDto>> getAll() {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll());
    }

    @GetMapping("/passageiro/{passageiroViagemId}")
    public ResponseEntity<List<BagagemDto>> getByPassageiroViagemId(@PathVariable Long passageiroViagemId) {
        List<BagagemDto> bagagens = service.findByPassageiroViagemId(passageiroViagemId);
        return ResponseEntity.status(HttpStatus.OK).body(bagagens);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable(value = "id") Long id) {
        Optional<BagagemDto> bagagem = service.findById(id);
        if (bagagem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bagagem não encontrada");
        }
        return ResponseEntity.status(HttpStatus.OK).body(bagagem.get());
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody BagagemDto dto) {
        try {
            var bagagemSalva = service.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(bagagemSalva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable(value = "id") Long id) {
        boolean deletado = service.delete(id);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bagagem não encontrada");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Bagagem deletada com sucesso");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable(value = "id") Long id, @RequestBody BagagemDto dto) {
        try {
            Optional<BagagemDto> bagagemAtualizada = service.update(id, dto);
            if (bagagemAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bagagem não encontrada");
            }
            return ResponseEntity.status(HttpStatus.OK).body(bagagemAtualizada.get());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}