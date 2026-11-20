package com.procuraflow.receptions.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CommandeResponse(
        Long id,
        String statut,
        List<LigneCommandeResponse> lignesCommande
) {
}