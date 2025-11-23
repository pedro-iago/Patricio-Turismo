package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.PessoaDto;
import com.partricioturismo.crud.service.PessoaService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pessoa")
public class PessoaController {

    @Autowired
    PessoaService service;

    @GetMapping
    public ResponseEntity<Page<PessoaDto>> getAll(Pageable pageable) {
        Page<PessoaDto> listPessoa = service.findAll(pageable);
        return ResponseEntity.status(HttpStatus.OK).body(listPessoa);
    }

    @GetMapping("/{idPessoa}")
    public ResponseEntity<Object> getById(@PathVariable(value = "idPessoa") Long idPessoa) {
        Optional<PessoaDto> pessoa = service.findById(idPessoa);
        if (pessoa.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pessoa não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(pessoa.get());
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody PessoaDto pessoaDto) {
        try {
            var pessoaSalva = service.save(pessoaDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(pessoaSalva);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{idPessoa}")
    public ResponseEntity<Object> delete(@PathVariable(value = "idPessoa") Long idPessoa) {
        boolean deletado = service.delete(idPessoa);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pessoa não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Pessoa deletada com sucesso");
    }

    @PutMapping("/{idPessoa}")
    public ResponseEntity<Object> update(@PathVariable(value = "idPessoa") Long idPessoa, @RequestBody PessoaDto pessoaDto) {
        try {
            Optional<PessoaDto> pessoaAtualizada = service.update(idPessoa, pessoaDto);
            if (pessoaAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pessoa não existente");
            }
            return ResponseEntity.status(HttpStatus.OK).body(pessoaAtualizada.get());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<PessoaDto>> searchPessoas(@RequestParam("query") String query) {
        List<PessoaDto> resultados = service.search(query);
        return ResponseEntity.ok(resultados);
    }
}