package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.EncomendaDto;
import com.partricioturismo.crud.model.Encomenda;
import com.partricioturismo.crud.service.EncomendaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/encomenda")
public class EncomendaController {

    @Autowired
    EncomendaService service;

    @GetMapping
    public ResponseEntity<List<Encomenda>> getAll() {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll());
    }

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<Encomenda>> getByViagemId(@PathVariable Long viagemId) {
        List<Encomenda> encomendas = service.findByViagemId(viagemId);
        return ResponseEntity.status(HttpStatus.OK).body(encomendas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable(value = "id") Long id) {
        Optional<Encomenda> encomenda = service.findById(id);
        if (encomenda.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Encomenda não encontrada");
        }
        return ResponseEntity.status(HttpStatus.OK).body(encomenda.get());
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody EncomendaDto dto) {
        try {
            var encomandaSalva = service.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(encomandaSalva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable(value = "id") Long id) {
        boolean deletado = service.delete(id);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Encomenda não encontrada");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Encomenda deletada com sucesso");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable(value = "id") Long id, @RequestBody EncomendaDto dto) {
        try {
            Optional<Encomenda> encomendaAtualizada = service.update(id, dto);
            if (encomendaAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Encomenda não encontrada");
            }
            return ResponseEntity.status(HttpStatus.OK).body(encomendaAtualizada.get());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}