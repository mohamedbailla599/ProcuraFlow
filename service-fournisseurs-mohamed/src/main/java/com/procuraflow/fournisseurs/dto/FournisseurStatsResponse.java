package com.procuraflow.fournisseurs.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Statistiques globales du catalogue fournisseurs (indépendantes de la pagination)")
public record FournisseurStatsResponse(

        @Schema(description = "Nombre total de fournisseurs enregistrés", example = "128")
        long total,

        @Schema(description = "Nombre de fournisseurs actifs", example = "112")
        long actifs,

        @Schema(description = "Nombre de fournisseurs inactifs", example = "16")
        long inactifs,

        @Schema(description = "Pourcentage d'éligibilité (actifs / total)", example = "88")
        int tauxEligibilite,

        @Schema(description = "Liste triée des villes détectées dans l'ensemble du catalogue")
        List<String> villes
) {
}

