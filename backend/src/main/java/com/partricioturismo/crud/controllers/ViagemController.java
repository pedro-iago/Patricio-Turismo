package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.ViagemDto;
import com.partricioturismo.crud.model.Viagem;
import com.partricioturismo.crud.service.ViagemService; // <-- MUDOU
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/viagem")
public class ViagemController {

    @Autowired
    ViagemService service; // <-- MUEndereco

    @GetMapping
    public ResponseEntity<List<Viagem>> getAll() {
        List<Viagem> listViagem = service.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(listViagem);
    }

    @GetMapping("/{idViagem}")
    public ResponseEntity<Object> getById(@PathVariable(value = "idViagem") Long idViagem) { // <-- MUDOU (Long)
        Optional<Viagem> viagem = service.findById(idViagem);
        if (viagem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(viagem.get()); // <-- MUDOU (Status OK)
    }

    @PostMapping
    public ResponseEntity<Object> save(@RequestBody ViagemDto viagemDto) {
        try {
            var viagemSalva = service.save(viagemDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(viagemSalva);
        } catch (RuntimeException e) {
            // Captura o "Ônibus não encontrado!" do service
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{idViagem}")
    public ResponseEntity<Object> delete(@PathVariable(value = "idViagem") Long idViagem) { // <-- MUDOU (Long)
        boolean deletado = service.delete(idViagem);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Viagem deletada com sucesso");
    }

    @PutMapping("/{idViagem}")
    public ResponseEntity<Object> update(@PathVariable(value = "idViagem") Long idViagem, @RequestBody ViagemDto viagemDto) { // <-- MUDOU (Long)
        try {
            Optional<Viagem> viagemAtualizada = service.update(idViagem, viagemDto);
            if (viagemAtualizada.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Viagem não existente");
            }
            return ResponseEntity.status(HttpStatus.OK).body(viagemAtualizada.get());
        } catch (RuntimeException e) {
            // Captura o "Ônibus não encontrado!" do service
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}