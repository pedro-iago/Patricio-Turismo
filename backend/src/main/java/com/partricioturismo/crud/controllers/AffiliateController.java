package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.AffiliateDto;
import com.partricioturismo.crud.dtos.AffiliateResponseDto;
import com.partricioturismo.crud.dtos.CreateAffiliateRequestDto;
import com.partricioturismo.crud.service.AffiliateService;
import jakarta.persistence.EntityNotFoundException; // Import necessário para tratar o erro
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/affiliates")
public class AffiliateController {

    @Autowired
    private AffiliateService affiliateService;

    // --- ENDPOINTS DE TAXISTA ---

    @GetMapping("/taxistas")
    public ResponseEntity<Page<AffiliateResponseDto>> getAllTaxistas(Pageable pageable) {
        return ResponseEntity.ok(affiliateService.getAllTaxistas(pageable));
    }

    // ✅ NOVO ENDPOINT: Busca Taxista Específico
    @GetMapping("/taxistas/{id}")
    public ResponseEntity<AffiliateResponseDto> getTaxistaById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(affiliateService.getTaxistaById(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/taxistas")
    public ResponseEntity<Object> createTaxista(@RequestBody CreateAffiliateRequestDto dto) {
        try {
            AffiliateDto newTaxista = affiliateService.createTaxista(dto);
            return new ResponseEntity<>(newTaxista, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/taxistas/{id}")
    public ResponseEntity<Void> deleteTaxista(@PathVariable Long id) {
        try {
            affiliateService.deleteTaxista(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- ENDPOINTS DE COMISSEIRO ---

    @GetMapping("/comisseiros")
    public ResponseEntity<Page<AffiliateResponseDto>> getAllComisseiros(Pageable pageable) {
        return ResponseEntity.ok(affiliateService.getAllComisseiros(pageable));
    }

    // ✅ NOVO ENDPOINT: Busca Comisseiro Específico
    @GetMapping("/comisseiros/{id}")
    public ResponseEntity<AffiliateResponseDto> getComisseiroById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(affiliateService.getComisseiroById(id));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/comisseiros")
    public ResponseEntity<Object> createComisseiro(@RequestBody CreateAffiliateRequestDto dto) {
        try {
            AffiliateDto newComisseiro = affiliateService.createComisseiro(dto);
            return new ResponseEntity<>(newComisseiro, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/comisseiros/{id}")
    public ResponseEntity<Void> deleteComisseiro(@PathVariable Long id) {
        try {
            affiliateService.deleteComisseiro(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}