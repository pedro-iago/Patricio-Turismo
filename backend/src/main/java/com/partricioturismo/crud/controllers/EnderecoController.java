package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.EnderecoDto;
import com.partricioturismo.crud.service.EnderecoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientException;

// --- IMPORTS NOVOS ---
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/endereco")
public class EnderecoController {

    @Autowired
    EnderecoService service;

    // --- ENDPOINT ATUALIZADO (Passo 4) ---
    @GetMapping
    public ResponseEntity<Page<EnderecoDto>> getAll(Pageable pageable) {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll(pageable));
    }

    // ... (mantenha os outros métodos: getById, save, delete, update, search, consultarCep) ...

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable(value = "id") Long id) {
        Optional<EnderecoDto> endereco = service.findById(id);
        if (endereco.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(endereco.get());
    }

    @PostMapping
    public ResponseEntity<EnderecoDto> save(@RequestBody EnderecoDto enderecoDto) {
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
        Optional<EnderecoDto> enderecoAtualizado = service.update(id, enderecoDto);
        if (enderecoAtualizado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Endereço não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(enderecoAtualizado.get());
    }

    @GetMapping("/search")
    public ResponseEntity<List<EnderecoDto>> searchEnderecos(@RequestParam("query") String query) {
        List<EnderecoDto> resultados = service.search(query);
        return ResponseEntity.ok(resultados);
    }

    @GetMapping("/consulta-cep")
    public ResponseEntity<Object> consultarCep(@RequestParam("cep") String cep) {
        try {
            EnderecoDto enderecoDto = service.consultarCep(cep);
            return ResponseEntity.ok(enderecoDto);
        } catch (WebClientException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Erro ao conectar-se ao serviço ViaCEP: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}