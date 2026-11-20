package com.procuraflow.receptions.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LigneCommandeResponse(
        Long id,
        String designation,
        Integer quantite
) {
}