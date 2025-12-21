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
import java.util.Map;

@RestController
@RequestMapping("/api/passageiroviagem")
public class PassageiroViagemController {

    @Autowired PassageiroViagemService service;

    @GetMapping
    public ResponseEntity<List<PassengerResponseDto>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> findByViagemId(@PathVariable Long viagemId) {
        return ResponseEntity.ok(service.findByViagemId(viagemId));
    }

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

    @GetMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> findById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PassengerSaveRequestDto dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.save(dto));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao criar: " + e.getMessage());
        }
    }

    // ✅ CORREÇÃO: Retorna erro detalhado para o frontend
    @PostMapping("/grupo")
    public ResponseEntity<?> createGroup(@RequestBody FamilyGroupRequestDto dto) {
        try {
            return ResponseEntity.ok(service.salvarGrupoFamilia(dto));
        } catch (Exception e) {
            e.printStackTrace(); // Mostra no console do servidor
            return ResponseEntity.badRequest().body("Erro ao salvar grupo: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PassengerSaveRequestDto dto) {
        try {
            return service.update(id, dto)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return service.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    // --- VÍNCULOS E ORDENAÇÃO ---

    @PostMapping("/{id}/vincular/{targetId}")
    public ResponseEntity<?> vincular(@PathVariable Long id, @PathVariable Long targetId) {
        try {
            service.vincularGrupo(id, targetId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao vincular: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/desvincular")
    public ResponseEntity<Void> desvincular(@PathVariable Long id) {
        try {
            service.desvincularGrupo(id);
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/reordenar")
    public ResponseEntity<Void> reordenar(@RequestBody Map<String, List<Long>> payload) {
        List<Long> ids = payload.get("ids");
        if (ids != null && !ids.isEmpty()) {
            service.reordenarPassageiros(ids);
        }
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/pagar")
    public ResponseEntity<Object> markAsPaid(@PathVariable Long id) {
        return service.markAsPaid(id)
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
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
            return ResponseEntity.ok(service.updateCor(id, dto.cor()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}