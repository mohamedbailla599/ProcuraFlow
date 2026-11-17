package com.procuraflow.receptions.dto;

import com.procuraflow.receptions.entity.Reception;

import java.time.LocalDateTime;

public record ReceptionResponse(
        Long  id,
        Long commandeId,
        LocalDateTime dateReception,
        String remarques,
        String statutReception
) {
    public static ReceptionResponse from(Reception reception) {
        return new ReceptionResponse(
                reception.getId(),
                reception.getCommandeId(),
                reception.getDateReception(),
                reception.getRemarques(),
                reception.getStatutReception()
        );
    }
}