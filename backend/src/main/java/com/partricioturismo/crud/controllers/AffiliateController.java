package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.AffiliateDto;
import com.partricioturismo.crud.dtos.AffiliateResponseDto; // <-- IMPORT NOVO
import com.partricioturismo.crud.dtos.CreateAffiliateRequestDto;
import com.partricioturismo.crud.service.AffiliateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// --- IMPORTS NOVOS ---
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/v1/affiliates")
public class AffiliateController {

    @Autowired
    private AffiliateService affiliateService;

    // --- ENDPOINTS DE TAXISTA ---

    // --- ENDPOINT ATUALIZADO (Passo 4) ---
    @GetMapping("/taxistas")
    public ResponseEntity<Page<AffiliateResponseDto>> getAllTaxistas(Pageable pageable) {
        return ResponseEntity.ok(affiliateService.getAllTaxistas(pageable));
    }

    @PostMapping("/taxistas")
    public ResponseEntity<AffiliateDto> createTaxista(@RequestBody CreateAffiliateRequestDto dto) {
        AffiliateDto newTaxista = affiliateService.createTaxista(dto);
        return new ResponseEntity<>(newTaxista, HttpStatus.CREATED);
    }

    @DeleteMapping("/taxistas/{id}")
    public ResponseEntity<Void> deleteTaxista(@PathVariable Long id) {
        affiliateService.deleteTaxista(id);
        return ResponseEntity.noContent().build();
    }

    // --- ENDPOINTS DE COMISSEIRO ---

    // --- ENDPOINT ATUALIZADO (Passo 4) ---
    @GetMapping("/comisseiros")
    public ResponseEntity<Page<AffiliateResponseDto>> getAllComisseiros(Pageable pageable) {
        return ResponseEntity.ok(affiliateService.getAllComisseiros(pageable));
    }

    @PostMapping("/comisseiros")
    public ResponseEntity<AffiliateDto> createComisseiro(@RequestBody CreateAffiliateRequestDto dto) {
        AffiliateDto newComisseiro = affiliateService.createComisseiro(dto);
        return new ResponseEntity<>(newComisseiro, HttpStatus.CREATED);
    }

    @DeleteMapping("/comisseiros/{id}")
    public ResponseEntity<Void> deleteComisseiro(@PathVariable Long id) {
        affiliateService.deleteComisseiro(id);
        return ResponseEntity.noContent().build();
    }
}