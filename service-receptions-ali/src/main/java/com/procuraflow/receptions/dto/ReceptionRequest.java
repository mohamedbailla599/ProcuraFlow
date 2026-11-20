package com.procuraflow.receptions.dto;

import java.util.List;
import java.util.UUID;

public record ReceptionRequest(UUID cleCreation, Long commandeId, String remarques, List<Ligne> lignes) {
    public record Ligne(Long ligneCommandeId, Integer quantiteRecue, String remarques) {}
}

