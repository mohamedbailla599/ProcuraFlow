package com.procuraflow.receptions.controller;

import com.procuraflow.receptions.dto.ReceptionResponse;
import com.procuraflow.receptions.service.ReceptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/receptions")
public class ReceptionController {

    private final ReceptionService service;

    public ReceptionController(ReceptionService service) {
        this.service = service;
    }

    @GetMapping
    public List<ReceptionResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceptionResponse> findById(@PathVariable("id") Long  id) {
        return ResponseEntity.of(service.findById(id));
    }
}