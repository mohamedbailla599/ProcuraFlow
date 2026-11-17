package com.procuraflow.receptions.controller;

import com.procuraflow.receptions.dto.ReceptionRequest;
import com.procuraflow.receptions.dto.ReceptionResponse;
import com.procuraflow.receptions.service.ReceptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/receptions")
public class ReceptionController {
    private final ReceptionService service;

    public ReceptionController(ReceptionService service) { this.service = service; }

    @GetMapping
    public List<ReceptionResponse> list(@RequestParam(required = false) Long commandeId) {
        return service.list(commandeId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceptionResponse> findById(@PathVariable Long id) {
        return ResponseEntity.of(service.findById(id));
    }

    @GetMapping("/commandes/{id}/soldes")
    public List<ReceptionService.Solde> soldes(@PathVariable Long id) {
        return service.soldes(id);
    }

    @PostMapping
    public ResponseEntity<ReceptionResponse> creer(@RequestBody ReceptionRequest demande) {
        var resultat = service.creer(demande);
        var reception = resultat.reception();
        return resultat.nouvelle()
                ? ResponseEntity.created(URI.create("/api/receptions/" + reception.id())).body(reception)
                : ResponseEntity.ok(reception);
    }
}
