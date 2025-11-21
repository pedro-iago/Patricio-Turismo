package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.CorRequestDto;
import com.partricioturismo.crud.dtos.PassengerSaveRequestDto;
import com.partricioturismo.crud.dtos.PassengerResponseDto;
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

    // ... (endpoints existentes) ...

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> getByViagemId(@PathVariable Long viagemId) {
        return ResponseEntity.ok(service.findByViagemId(viagemId));
    }

    // ... (save, update, delete) ...

    @PatchMapping("/{id}/cor")
    public ResponseEntity<Object> updateCor(@PathVariable Long id, @RequestBody CorRequestDto dto) {
        try { return ResponseEntity.ok(service.updateCor(id, dto.cor())); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    // --- NOVO ENDPOINT DE REORDENAÇÃO ---
    @PatchMapping("/reordenar")
    public ResponseEntity<Void> reordenarLista(@RequestBody List<Long> ids) {
        try {
            service.reordenarPassageiros(ids);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}