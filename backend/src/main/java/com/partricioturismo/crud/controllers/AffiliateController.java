package com.partricioturismo.crud.controllers;

import com.partricioturismo.crud.dtos.AffiliateDto;
import com.partricioturismo.crud.dtos.CreateAffiliateRequestDto;
import com.partricioturismo.crud.service.AffiliateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/affiliates") // Endpoint base para afiliados
public class AffiliateController {

    @Autowired
    private AffiliateService affiliateService;

    // --- ENDPOINTS DE TAXISTA ---

    @GetMapping("/taxistas")
    public ResponseEntity<List<AffiliateDto>> getAllTaxistas() {
        return ResponseEntity.ok(affiliateService.getAllTaxistas());
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

    @GetMapping("/comisseiros")
    public ResponseEntity<List<AffiliateDto>> getAllComisseiros() {
        return ResponseEntity.ok(affiliateService.getAllComisseiros());
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