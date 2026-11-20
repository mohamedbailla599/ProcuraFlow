package com.procuraflow.fournisseurs.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.data.domain.Page;

@Schema(description = "Réponse paginée standardisée issue de Spring Data Page")
public record PageResponse<T>(

        @Schema(description = "Éléments de la page courante")
        List<T> content,

        @Schema(description = "Numéro de la page courante (indexé à 0)", example = "0")
        int page,

        @Schema(description = "Nombre maximal d'éléments par page", example = "10")
        int size,

        @Schema(description = "Nombre total d'éléments correspondant aux filtres", example = "128")
        long totalElements,

        @Schema(description = "Nombre total de pages", example = "13")
        int totalPages,

        @Schema(description = "Indique s'il s'agit de la première page", example = "true")
        boolean first,

        @Schema(description = "Indique s'il s'agit de la dernière page", example = "false")
        boolean last,

        @Schema(description = "Indique si la page courante est vide", example = "false")
        boolean empty
) {

    public static <T> PageResponse<T> from(Page<T> springPage) {
        return new PageResponse<>(
                springPage.getContent(),
                springPage.getNumber(),
                springPage.getSize(),
                springPage.getTotalElements(),
                springPage.getTotalPages(),
                springPage.isFirst(),
                springPage.isLast(),
                springPage.isEmpty()
        );
    }
}

