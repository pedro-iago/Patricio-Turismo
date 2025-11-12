package com.partricioturismo.crud.controllers;

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

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.transaction.annotation.Transactional; // <-- IMPORT NOVO

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    @Autowired
    private PassageiroViagemRepository passageiroViagemRepository;

    @Autowired
    private EncomendaRepository encomendaRepository;

    // --- RELATÓRIOS DE PASSAGEIROS (Existentes) ---

    @GetMapping("/passageiros/viagem/{viagemId}")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorViagem(
            @PathVariable Long viagemId) {
        List<PassageiroViagem> listaEntidade = passageiroViagemRepository.findByViagemId(viagemId);
        List<PassengerResponseDto> listaDto = listaEntidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/passageiros/viagem/{viagemId}/taxista/{taxistaId}")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorViagemETaxista(
            @PathVariable Long viagemId,
            @PathVariable Long taxistaId) {
        List<PassageiroViagem> listaEntidade = passageiroViagemRepository.findByViagemIdAndTaxistaId(viagemId, taxistaId);
        List<PassengerResponseDto> listaDto = listaEntidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/passageiros/viagem/{viagemId}/comisseiro/{comisseiroId}")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorViagemEComisseiro(
            @PathVariable Long viagemId,
            @PathVariable Long comisseiroId) {
        List<PassageiroViagem> listaEntidade = passageiroViagemRepository.findByViagemIdAndComisseiroId(viagemId, comisseiroId);
        List<PassengerResponseDto> listaDto = listaEntidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    // --- RELATÓRIOS DE ENCOMENDAS (Existentes) ---

    @GetMapping("/encomendas/viagem/{viagemId}")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorViagem(
            @PathVariable Long viagemId) {
        List<Encomenda> listaEntidade = encomendaRepository.findByViagemId(viagemId);
        List<EncomendaResponseDto> listaDto = listaEntidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/encomendas/viagem/{viagemId}/taxista/{taxistaId}")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorViagemETaxista(
            @PathVariable Long viagemId,
            @PathVariable Long taxistaId) {
        List<Encomenda> listaEntidade = encomendaRepository.findByViagemIdAndTaxistaId(viagemId, taxistaId);
        List<EncomendaResponseDto> listaDto = listaEntidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/encomendas/viagem/{viagemId}/comisseiro/{comisseiroId}")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorViagemEComisseiro(
            @PathVariable Long viagemId,
            @PathVariable Long comisseiroId) {
        List<Encomenda> listaEntidade = encomendaRepository.findByViagemIdAndComisseiroId(viagemId, comisseiroId);
        List<EncomendaResponseDto> listaDto = listaEntidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    // --- RELATÓRIOS DE PASSAGEIROS POR PERÍODO (Passo 3) ---

    @GetMapping("/taxista/{taxistaId}/passageiros")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorTaxistaEPeriodo(
            @PathVariable Long taxistaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        List<PassageiroViagem> entidade = passageiroViagemRepository.findByTaxistaIdAndViagemDataHoraPartidaBetween(taxistaId, inicio, fim);

        List<PassengerResponseDto> listaDto = entidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/comisseiro/{comisseiroId}/passageiros")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<PassengerResponseDto>> getPassageirosPorComisseiroEPeriodo(
            @PathVariable Long comisseiroId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        List<PassageiroViagem> entidade = passageiroViagemRepository.findByComisseiroIdAndViagemDataHoraPartidaBetween(comisseiroId, inicio, fim);

        List<PassengerResponseDto> listaDto = entidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    // --- ENDPOINTS NOVOS (Passo 3.B) ---

    @GetMapping("/taxista/{taxistaId}/encomendas")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorTaxistaEPeriodo(
            @PathVariable Long taxistaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        List<Encomenda> entidade = encomendaRepository.findByTaxistaIdAndViagemDataHoraPartidaBetween(taxistaId, inicio, fim);

        List<EncomendaResponseDto> listaDto = entidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/comisseiro/{comisseiroId}/encomendas")
    @Transactional(readOnly = true) // <-- ADICIONADO
    public ResponseEntity<List<EncomendaResponseDto>> getEncomendasPorComisseiroEPeriodo(
            @PathVariable Long comisseiroId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fim
    ) {
        List<Encomenda> entidade = encomendaRepository.findByComisseiroIdAndViagemDataHoraPartidaBetween(comisseiroId, inicio, fim);

        List<EncomendaResponseDto> listaDto = entidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }


    // --- RELATÓRIOS POR PESSOA (HISTÓRICO) ---

    @GetMapping("/pessoa/{pessoaId}/passageiros")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PassengerResponseDto>> getHistoricoPassageiro(
            @PathVariable Long pessoaId
    ) {
        List<PassageiroViagem> entidade = passageiroViagemRepository.findByPessoaIdWithHistory(pessoaId);
        List<PassengerResponseDto> listaDto = entidade.stream()
                .map(PassengerResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/pessoa/{pessoaId}/encomendas/enviadas")
    @Transactional(readOnly = true)
    public ResponseEntity<List<EncomendaResponseDto>> getHistoricoEncomendasEnviadas(
            @PathVariable Long pessoaId
    ) {
        List<Encomenda> entidade = encomendaRepository.findByRemetenteIdWithHistory(pessoaId);
        List<EncomendaResponseDto> listaDto = entidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }

    @GetMapping("/pessoa/{pessoaId}/encomendas/recebidas")
    @Transactional(readOnly = true)
    public ResponseEntity<List<EncomendaResponseDto>> getHistoricoEncomendasRecebidas(
            @PathVariable Long pessoaId
    ) {
        List<Encomenda> entidade = encomendaRepository.findByDestinatarioIdWithHistory(pessoaId);
        List<EncomendaResponseDto> listaDto = entidade.stream()
                .map(EncomendaResponseDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listaDto);
    }
}