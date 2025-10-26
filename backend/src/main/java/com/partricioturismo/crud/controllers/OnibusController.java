package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.OnibusDto;
import com.partricioturismo.crud.model.Onibus;
import com.partricioturismo.crud.service.OnibusService; // <-- MUDOU
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/onibus")
public class OnibusController {

    @Autowired
    OnibusService service; // <-- MUDOU (Injeta o SERVICE)

    @GetMapping
    public ResponseEntity<List<Onibus>> getAll() {
        List<Onibus> listOnibus = service.findAll();
        return ResponseEntity.status(HttpStatus.OK).body(listOnibus);
    }

    @GetMapping("/{idOnibus}")
    public ResponseEntity<Object> getById(@PathVariable(value = "idOnibus") Long idOnibus) { // <-- MUDOU (Long)
        Optional<Onibus> onibus = service.findById(idOnibus);
        if (onibus.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body(onibus.get()); // <-- MUDOU (Status OK)
    }

    @PostMapping
    public ResponseEntity<Onibus> save(@RequestBody OnibusDto onibusDto) {
        var onibusSalvo = service.save(onibusDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(onibusSalvo);
    }

    @DeleteMapping("/{idOnibus}")
    public ResponseEntity<Object> delete(@PathVariable(value = "idOnibus") Long idOnibus) { // <-- MUDOU (Long)
        boolean deletado = service.delete(idOnibus);
        if (!deletado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente");
        }
        return ResponseEntity.status(HttpStatus.OK).body("Onibus deletado com sucesso"); // <-- MUDOU
    }

    @PutMapping("/{idOnibus}")
    public ResponseEntity<Object> update(@PathVariable(value = "idOnibus") Long idOnibus, @RequestBody OnibusDto onibusDto) { // <-- MUDOU (Long)
        Optional<Onibus> onibusAtualizado = service.update(idOnibus, onibusDto);
        if (onibusAtualizado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Onibus não existente"); // <-- MUDOU
        }
        return ResponseEntity.status(HttpStatus.OK).body(onibusAtualizado.get());
    }
}