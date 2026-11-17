package com.procuraflow.receptions.service;

import com.procuraflow.receptions.dto.ReceptionResponse;
import com.procuraflow.receptions.repository.ReceptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ReceptionService {

    private final ReceptionRepository repository;

    public ReceptionService(ReceptionRepository repository) {
        this.repository = repository;
    }

    public List<ReceptionResponse> list() {
        return repository.findAllMostRecentFirst().stream()
                .map(ReceptionResponse::from)
                .toList();
    }

    public Optional<ReceptionResponse> findById(Long id) {
        return repository.findById(id).map(ReceptionResponse::from);
    }
}