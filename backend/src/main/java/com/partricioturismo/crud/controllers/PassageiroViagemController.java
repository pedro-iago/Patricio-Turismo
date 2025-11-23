package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.*;
import com.partricioturismo.crud.service.PassageiroViagemService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/passageiroviagem")
public class PassageiroViagemController {

    @Autowired
    PassageiroViagemService service;

    // === REORDENAR ===
    @PatchMapping("/reordenar")
    public ResponseEntity<Void> reordenar(@RequestBody ReorderRequestDto dto) {
        service.reordenarPassageiros(dto.ids());
        return ResponseEntity.noContent().build();
    }

    // === VINCULAR GRUPO ===
    @PostMapping("/{id}/vincular/{targetId}")
    public ResponseEntity<Void> vincular(@PathVariable Long id, @PathVariable Long targetId) {
        try {
            service.vincularGrupo(id, targetId);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // === DESVINCULAR GRUPO ===
    @PostMapping("/{id}/desvincular")
    public ResponseEntity<Void> desvincular(@PathVariable Long id) {
        service.desvincularGrupo(id);
        return ResponseEntity.ok().build();
    }

    // === ATRIBUIÇÃO EM MASSA (CORRIGIDO) ===
    @PostMapping("/atribuir-massa")
    public ResponseEntity<Void> atribuirEmMassa(@RequestBody BulkAssignRequestDto dto) {
        // CORREÇÃO AQUI: Passando dto.encomendaIds()
        service.atribuirTaxistaEmMassa(
                dto.passageiroIds(),
                dto.encomendaIds(), // <--- Novo argumento obrigatório
                dto.taxistaId(),
                dto.tipo()
        );
        return ResponseEntity.ok().build();
    }
    // =======================================

    @GetMapping
    public ResponseEntity<List<PassengerResponseDto>> getAll() { return ResponseEntity.ok(service.findAll()); }

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> getByViagemId(@PathVariable Long viagemId) { return ResponseEntity.ok(service.findByViagemId(viagemId)); }

    @GetMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody PassengerSaveRequestDto dto) {
        try { return ResponseEntity.status(HttpStatus.CREATED).body(service.save(dto)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable Long id, @RequestBody PassengerSaveRequestDto dto) {
        try { return ResponseEntity.ok(service.update(id, dto).get()); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        return service.delete(id) ? ResponseEntity.ok("Deletado") : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{id}/marcar-pago")
    public ResponseEntity<Object> markAsPaid(@PathVariable(value = "id") Long id) {
        try {
            Optional<PassengerResponseDto> pvAtualizado = service.markAsPaid(id);
            if (pvAtualizado.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
            return ResponseEntity.ok(pvAtualizado.get());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/vincular-assento")
    public ResponseEntity<Object> vincularAssento(@PathVariable Long id, @RequestParam Long onibusId, @RequestParam(required = false) String numero) {
        try {
            return ResponseEntity.ok(service.vincularAssentoPorNumero(id, onibusId, numero));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cor")
    public ResponseEntity<Object> updateCor(@PathVariable Long id, @RequestBody CorRequestDto dto) {
        try {
            PassengerResponseDto response = service.updateCor(id, dto.cor());
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}