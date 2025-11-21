package com.partricioturismo.crud.controllers;

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
@RequestMapping("/api/passageiroviagem") // <-- MUDANÇA AQUI
public class PassageiroViagemController {

    @Autowired
    PassageiroViagemService service;

    @GetMapping
    public ResponseEntity<List<PassengerResponseDto>> getAll() {
        return ResponseEntity.status(HttpStatus.OK).body(service.findAll());
    }

    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> getByViagemId(@PathVariable Long viagemId) {
        List<PassengerResponseDto> passageiros = service.findByViagemId(viagemId);
        return ResponseEntity.status(HttpStatus.OK).body(passageiros);
    }

    // --- MÉTODO ATUALIZADO ---
    @GetMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> getById(@PathVariable(value = "id") Long id) {
        // Agora usa o retorno direto do service (que foi corrigido)
        return service.findById(id)
                .map(dto -> ResponseEntity.ok(dto)) // Se encontrar, retorna 200 OK com o DTO
                .orElse(ResponseEntity.notFound().build()); // Se não, retorna 404 Not Found
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody PassengerSaveRequestDto dto) {
        try {
            PassengerResponseDto pvSalvo = service.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(pvSalvo);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable(value = "id") Long id) {
        boolean deletado = service.delete(id);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Registro deletado com sucesso");
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable(value = "id") Long id, @RequestBody PassengerSaveRequestDto dto) {
        try {
            Optional<PassengerResponseDto> pvAtualizado = service.update(id, dto);
            if (pvAtualizado.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
            }
            return ResponseEntity.status(HttpStatus.OK).body(pvAtualizado.get());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/marcar-pago")
    public ResponseEntity<Object> markAsPaid(@PathVariable(value = "id") Long id) {
        try {
            Optional<PassengerResponseDto> pvAtualizado = service.markAsPaid(id);
            if (pvAtualizado.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
            }
            return ResponseEntity.status(HttpStatus.OK).body(pvAtualizado.get());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}