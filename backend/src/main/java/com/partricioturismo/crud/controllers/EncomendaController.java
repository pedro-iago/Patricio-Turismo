package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.CorRequestDto; // Certifique-se de importar isso
import com.partricioturismo.crud.dtos.EncomendaSaveRequestDto;
import com.partricioturismo.crud.dtos.EncomendaResponseDto;
import com.partricioturismo.crud.service.EncomendaService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/encomenda")
public class EncomendaController {

    @Autowired
    EncomendaService service;

    @GetMapping
    public ResponseEntity<List<EncomendaResponseDto>> getAll() {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll());
    }

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<EncomendaResponseDto>> getByViagemId(@PathVariable Long viagemId) {
        List<EncomendaResponseDto> encomendas = service.findByViagemId(viagemId);
        return ResponseEntity.status(HttpStatus.OK).body(encomendas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EncomendaResponseDto> getById(@PathVariable(value = "id") Long id) {
        Optional<EncomendaResponseDto> encomenda = service.findById(id);
        if (encomenda.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.OK).body(encomenda.get());
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody EncomendaSaveRequestDto dto) {
        try {
            EncomendaResponseDto encomandaSalva = service.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(encomandaSalva);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
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
    public ResponseEntity<Object> update(@PathVariable(value = "id") Long id, @RequestBody EncomendaSaveRequestDto dto) {
        try {
            Optional<EncomendaResponseDto> encomendaAtualizada = service.update(id, dto);
            if (encomendaAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Encomenda não encontrada");
            }
            return ResponseEntity.status(HttpStatus.OK).body(encomendaAtualizada.get());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/marcar-pago")
    public ResponseEntity<Object> markAsPaid(@PathVariable(value = "id") Long id) {
        try {
            Optional<EncomendaResponseDto> encAtualizada = service.markAsPaid(id);
            if (encAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Encomenda não encontrada");
            }
            return ResponseEntity.status(HttpStatus.OK).body(encAtualizada.get());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // --- NOVO ENDPOINT: ATUALIZAR COR (V11) ---
    @PatchMapping("/{id}/cor")
    public ResponseEntity<Object> updateCor(@PathVariable Long id, @RequestBody CorRequestDto dto) {
        try {
            EncomendaResponseDto response = service.updateCor(id, dto.cor());
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    // -----------------------------------------
}