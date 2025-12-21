package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.*;
import com.partricioturismo.crud.service.PassageiroViagemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/passageiroviagem")
public class PassageiroViagemController {

    @Autowired PassageiroViagemService service;

    // LEITURA GERAL
    @GetMapping
    public ResponseEntity<List<PassengerResponseDto>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2000") int size
    ) {
        return ResponseEntity.ok(service.findAll(page, size));
    }

    // POR VIAGEM
    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> findByViagemId(@PathVariable Long viagemId) {
        return ResponseEntity.ok(service.findByViagemId(viagemId));
    }

    // HISTÓRICOS (NECESSÁRIOS PARA AS NOVAS TELAS)
    @GetMapping("/historico/taxista/{id}")
    public ResponseEntity<List<PassengerResponseDto>> getHistoricoTaxista(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        return ResponseEntity.ok(service.getHistoricoTaxista(id, inicio, fim));
    }

    @GetMapping("/historico/comisseiro/{id}")
    public ResponseEntity<List<PassengerResponseDto>> getHistoricoComisseiro(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim) {
        return ResponseEntity.ok(service.getHistoricoComisseiro(id, inicio, fim));
    }

    @GetMapping("/historico/pessoa/{id}")
    public ResponseEntity<List<PassengerResponseDto>> getHistoricoPessoa(@PathVariable Long id) {
        return ResponseEntity.ok(service.getHistoricoPessoa(id));
    }

    // CRUD BÁSICO
    @GetMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> findById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PassengerResponseDto> create(@RequestBody PassengerSaveRequestDto dto) {
        try { return ResponseEntity.status(HttpStatus.CREATED).body(service.save(dto)); }
        catch (EntityNotFoundException e) { return ResponseEntity.badRequest().build(); }
    }

    @PostMapping("/grupo")
    public ResponseEntity<List<PassengerResponseDto>> createGroup(@RequestBody FamilyGroupRequestDto dto) {
        try { return ResponseEntity.ok(service.salvarGrupoFamilia(dto)); }
        catch (Exception e) { return ResponseEntity.badRequest().build(); }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> update(@PathVariable Long id, @RequestBody PassengerSaveRequestDto dto) {
        try { return ResponseEntity.ok(service.update(id, dto)); }
        catch (EntityNotFoundException e) { return ResponseEntity.notFound().build(); }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/pagar")
    public ResponseEntity<Object> markAsPaid(@PathVariable Long id) {
        try {
            Optional<PassengerResponseDto> pv = service.markAsPaid(id);
            if (pv.isEmpty()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(pv.get());
        } catch (Exception e) { return ResponseEntity.internalServerError().body(e.getMessage()); }
    }

    @PatchMapping("/{id}/vincular-assento")
    public ResponseEntity<Object> vincularAssento(@PathVariable Long id, @RequestParam Long onibusId, @RequestParam(required = false) String numero) {
        try { return ResponseEntity.ok(service.vincularAssentoPorNumero(id, onibusId, numero)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PatchMapping("/{id}/cor")
    public ResponseEntity<Object> updateCor(@PathVariable Long id, @RequestBody CorRequestDto dto) {
        try { return ResponseEntity.ok(service.updateCor(id, dto.cor())); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }
}