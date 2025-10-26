package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.EnderecoDto;
import com.partricioturismo.crud.model.Endereco;
import com.partricioturismo.crud.service.EnderecoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/endereco")
public class EnderecoController {

    @Autowired
    EnderecoService service;

    @GetMapping
    public ResponseEntity<List<Endereco>> getAll() {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable(value = "id") Long id) {
        Optional<Endereco> endereco = service.findById(id);
        if (endereco.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(endereco.get());
    }

    @PostMapping
    public ResponseEntity<Endereco> save(@RequestBody EnderecoDto enderecoDto) {
        var enderecoSalvo = service.save(enderecoDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(enderecoSalvo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable(value = "id") Long id) {
        boolean deletado = service.delete(id);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Endereço deletado com sucesso");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable(value = "id") Long id, @RequestBody EnderecoDto enderecoDto) {
        Optional<Endereco> enderecoAtualizado = service.update(id, enderecoDto);
        if (enderecoAtualizado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(enderecoAtualizado.get());
    }
}