package com.procuraflow.receptions.dto;

import com.procuraflow.receptions.entity.Reception;
import java.time.OffsetDateTime;
import java.util.List;

public record ReceptionResponse(Long id, Long commandeId, OffsetDateTime dateReception,
                                String remarques, String statutReception, List<Ligne> lignes) {
    public record Ligne(Long id, Long ligneCommandeId, int quantiteRecue, String remarques) {}

    public static ReceptionResponse from(Reception reception) {
        var lignes = reception.getLignes().stream()
                .map(l -> new Ligne(l.getId(), l.getLigneCommandeId(), l.getQuantiteRecue(), l.getRemarques()))
                .toList();
        return new ReceptionResponse(reception.getId(), reception.getCommandeId(), reception.getDateReception(),
                reception.getRemarques(), reception.getStatutReception(), lignes);
    }
}
