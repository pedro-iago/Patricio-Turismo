package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.AssentoLayoutDto;
import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.service.AssentoService;
import com.partricioturismo.crud.service.OnibusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/onibus")
public class OnibusController {

    @Autowired
    private OnibusService service;

    @Autowired
    private AssentoService assentoService;

    @GetMapping
    public ResponseEntity<List<OnibusDto>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable Long id) {
        Optional<OnibusDto> onibus = service.findById(id);
        if (onibus.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");
        return ResponseEntity.ok(onibus.get());
    }

    // --- NOVO ENDPOINT: Retorna o desenho dos assentos ---
    @GetMapping("/{id}/layout")
    public ResponseEntity<List<List<AssentoLayoutDto>>> getLayoutOnibus(@PathVariable Long id) {
        List<List<AssentoLayoutDto>> layout = assentoService.getMapaAssentos(id);
        return ResponseEntity.ok(layout);
    }

    @PostMapping
    public ResponseEntity<OnibusDto> save(@RequestBody OnibusDto onibusDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(onibusDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        boolean deletado = service.delete(id);
        if (!deletado) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");
        return ResponseEntity.ok("Onibus deletado com sucesso");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable Long id, @RequestBody OnibusDto onibusDto) {
        Optional<OnibusDto> onibusAtualizado = service.update(id, onibusDto);
        if (onibusAtualizado.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");
        return ResponseEntity.ok(onibusAtualizado.get());
    }
}