package com.partricioturismo.crud.controllers;

// --- Imports Adicionados ---
import com.partricioturismo.crud.dtos.EncomendaResponseDto;
import com.partricioturismo.crud.dtos.PassengerResponseDto;

import com.partricioturismo.crud.model.Encomenda;
import com.partricioturismo.crud.model.PassageiroViagem;
import com.partricioturismo.crud.repositories.EncomendaRepository;
import com.partricioturismo.crud.repositories.PassageiroViagemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors; // <<< NECESSÁRIO PARA A CONVERSÃO

/**
 * Controller focado em fornecer dados brutos para relatórios no frontend.
 * Converte todas as Entidades em DTOs para evitar erros de Lazy Loading.
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    @Autowired
    private PassageiroViagemRepository passageiroViagemRepository;

    @Autowired
    private EncomendaRepository encomendaRepository;

    // --- RELATÓRIOS DE PASSAGEIROS (Retornando DTOs) ---

    @GetMapping("/passageiros/viagem/{viagemId}")
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorViagem(
            @PathVariable Long viagemId) {

        List<PassageiroViagem> listaEntidade = passageiroViagemRepository.findByViagemId(viagemId);
        // --- CORREÇÃO ---
        // Converte a lista de Entidades para uma lista de DTOs
        List<PassengerResponseDto> listaDto = listaEntidade.stream()
                .map(PassengerResponseDto::new) // Usa o construtor do DTO
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/passageiros/viagem/{viagemId}/taxista/{taxistaId}")
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorViagemETaxista(
            @PathVariable Long viagemId,
            @PathVariable Long taxistaId) {

        List<PassageiroViagem> listaEntidade = passageiroViagemRepository.findByViagemIdAndTaxistaId(viagemId, taxistaId);
        // --- CORREÇÃO ---
        List<PassengerResponseDto> listaDto = listaEntidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/passageiros/viagem/{viagemId}/comisseiro/{comisseiroId}")
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorViagemEComisseiro(
            @PathVariable Long viagemId,
            @PathVariable Long comisseiroId) {

        List<PassageiroViagem> listaEntidade = passageiroViagemRepository.findByViagemIdAndComisseiroId(viagemId, comisseiroId);
        // --- CORREÇÃO ---
        List<PassengerResponseDto> listaDto = listaEntidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    // --- RELATÓRIOS DE ENCOMENDAS (Retornando DTOs) ---

    @GetMapping("/encomendas/viagem/{viagemId}")
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorViagem(
            @PathVariable Long viagemId) {

        List<Encomenda> listaEntidade = encomendaRepository.findByViagemId(viagemId);
        // --- CORREÇÃO ---
        List<EncomendaResponseDto> listaDto = listaEntidade.stream()
                .map(EncomendaResponseDto::new) // Usa o construtor do DTO
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/encomendas/viagem/{viagemId}/taxista/{taxistaId}")
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorViagemETaxista(
            @PathVariable Long viagemId,
            @PathVariable Long taxistaId) {

        List<Encomenda> listaEntidade = encomendaRepository.findByViagemIdAndTaxistaId(viagemId, taxistaId);
        // --- CORREÇÃO ---
        List<EncomendaResponseDto> listaDto = listaEntidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/encomendas/viagem/{viagemId}/comisseiro/{comisseiroId}")
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorViagemEComisseiro(
            @PathVariable Long viagemId,
            @PathVariable Long comisseiroId) {

        List<Encomenda> listaEntidade = encomendaRepository.findByViagemIdAndComisseiroId(viagemId, comisseiroId);
        // --- CORREÇÃO ---
        List<EncomendaResponseDto> listaDto = listaEntidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }
}