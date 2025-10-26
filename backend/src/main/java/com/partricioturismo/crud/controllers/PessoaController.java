package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.PessoaDto; // <-- MUDOU
import com.partricioturismo.crud.model.Pessoa;
import com.partricioturismo.crud.service.PessoaService; // <-- MUDOU
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/pessoa") // <-- MUDOU
public class PessoaController {

    @Autowired
    PessoaService service; // <-- MUDOU (Injeta o SERVICE)


    @GetMapping
    public ResponseEntity<List<Pessoa>> getAll() { // <-- MUDOU (boa prática)
        List<Pessoa> listPessoa = service.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(listPessoa);
    }

    @GetMapping("/{idPessoa}")
    public ResponseEntity<Object> getById(@PathVariable(value = "idPessoa") Long idPessoa) {
        Optional<Pessoa> pessoa = service.findById(idPessoa);
        if (pessoa.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pessoa não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(pessoa.get());
    }

    @PostMapping
    public ResponseEntity<Pessoa> save(@RequestBody PessoaDto pessoaDto) {
        var pessoaSalva = service.save(pessoaDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(pessoaSalva);
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
    public ResponseEntity<Object> update(@PathVariable(value = "idPessoa") Long idPessoa, @RequestBody PessoaDto pessoaDto) { // <-- MUDOU
        Optional<Pessoa> pessoaAtualizada = service.update(idPessoa, pessoaDto);
        if (pessoaAtualizada.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Pessoa não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(pessoaAtualizada.get());
    }
}