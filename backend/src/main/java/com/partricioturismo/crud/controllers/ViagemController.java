package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.AssentoDto;
import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.dtos.ViagemSaveRequestDto;
import com.partricioturismo.crud.service.AssentoService;
import com.partricioturismo.crud.service.ViagemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/viagem")
public class ViagemController {

    @Autowired
    ViagemService service;

    @Autowired
    AssentoService assentoService;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano,
            @RequestParam(required = false) String query,
            Pageable pageable
    ) {
        try {
            Page<ViagemDto> listViagem = service.findAll(mes, ano, query, pageable);
            return ResponseEntity.status(HttpStatus.OK).body(listViagem);
        } catch (Exception e) {
            // ISSO VAI IMPRIMIR O ERRO REAL NO SEU TERMINAL
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro interno ao buscar viagens: " + e.getMessage());
        }
    }

    @GetMapping("/{idViagem}")
    public ResponseEntity<Object> getById(@PathVariable(value = "idViagem") Long idViagem) {
        try {
            ViagemDto viagem = service.findById(idViagem);
            return ResponseEntity.status(HttpStatus.OK).body(viagem);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
        }
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody ViagemSaveRequestDto viagemDto) {
        try {
            var viagemSalva = service.save(viagemDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(viagemSalva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{idViagem}")
    public ResponseEntity<Object> delete(@PathVariable(value = "idViagem") Long idViagem) {
        boolean deletado = service.delete(idViagem);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Viagem deletada com sucesso");
    }

    @PutMapping("/{idViagem}")
    public ResponseEntity<Object> update(@PathVariable(value = "idViagem") Long idViagem, @RequestBody ViagemSaveRequestDto viagemDto) {
        try {
            var viagemAtualizada = service.update(idViagem, viagemDto);
            if (viagemAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
            }
            return ResponseEntity.status(HttpStatus.OK).body(viagemAtualizada.get());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{idViagem}/assentos")
    public ResponseEntity<List<AssentoDto>> getAssentosDaViagem(@PathVariable Long idViagem) {
        List<AssentoDto> assentos = assentoService.findByViagemId(idViagem);
        return ResponseEntity.ok(assentos);
    }
}