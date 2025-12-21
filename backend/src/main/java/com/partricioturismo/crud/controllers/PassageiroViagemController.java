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

    // === LISTAR POR VIAGEM ===
    @GetMapping("/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> findByViagemId(@PathVariable Long viagemId) {
        return ResponseEntity.ok(service.findByViagemId(viagemId));
    }

    // === BUSCAR UM ===
    @GetMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // === CRIAR INDIVIDUAL ===
    @PostMapping
    public ResponseEntity<PassengerResponseDto> create(@RequestBody PassengerSaveRequestDto dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.save(dto));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // === NOVA FUNCIONALIDADE: CRIAR GRUPO FAMÍLIA ===
    @PostMapping("/grupo")
    public ResponseEntity<List<PassengerResponseDto>> createFamilyGroup(@RequestBody FamilyGroupRequestDto dto) {
        try {
            List<PassengerResponseDto> novosPassageiros = service.salvarGrupoFamilia(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(novosPassageiros);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // === ATUALIZAR ===
    @PutMapping("/{id}")
    public ResponseEntity<PassengerResponseDto> update(@PathVariable Long id, @RequestBody PassengerSaveRequestDto dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // === DELETAR (Corrigido o erro de boolean) ===
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            service.delete(id); // Agora retorna void, não precisa de IF
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // === ATRIBUIÇÃO EM MASSA (Corrigido argumentos) ===
    @PostMapping("/atribuir-em-massa")
    public ResponseEntity<Void> atribuirEmMassa(@RequestBody BulkAssignRequestDto dto) {
        // O service espera: List<Long> pIds, List<Long> eIds, Long taxistaId, String tipo
        service.atribuirTaxistaEmMassa(
                dto.passageiroIds(),
                dto.encomendaIds(), // Passando null ou lista vazia se o DTO não tiver
                dto.taxistaId(),
                dto.tipo()
        );
        return ResponseEntity.ok().build();
    }

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
        try {
            service.desvincularGrupo(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // === MARCAR PAGO (Corrigido erro do .get) ===
    @PatchMapping("/{id}/marcar-pago")
    public ResponseEntity<Object> markAsPaid(@PathVariable(value = "id") Long id) {
        try {
            Optional<PassengerResponseDto> pvAtualizado = service.markAsPaid(id);

            if (pvAtualizado.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Registro não encontrado");
            }

            // Aqui estava o erro: antes o código podia estar tentando dar .get() em algo que não era Optional
            return ResponseEntity.ok(pvAtualizado.get());

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // === VINCULAR ASSENTO ===
    @PatchMapping("/{id}/vincular-assento")
    public ResponseEntity<Object> vincularAssento(@PathVariable Long id, @RequestParam Long onibusId, @RequestParam(required = false) String numero) {
        try {
            return ResponseEntity.ok(service.vincularAssentoPorNumero(id, onibusId, numero));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // === ATUALIZAR COR DA TAG ===
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