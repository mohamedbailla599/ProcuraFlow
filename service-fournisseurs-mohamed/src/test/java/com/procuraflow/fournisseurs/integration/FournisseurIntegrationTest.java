package com.procuraflow.fournisseurs.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procuraflow.fournisseurs.dto.FournisseurRequest;
import com.procuraflow.fournisseurs.dto.FournisseurResponse;
import com.procuraflow.fournisseurs.entity.Fournisseur;
import com.procuraflow.fournisseurs.repository.FournisseurRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FournisseurIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FournisseurRepository fournisseurRepository;

    @BeforeEach
    void cleanDatabase() {
        fournisseurRepository.deleteAll();
    }

    @Test
    void fullSupplierLifecycle_createListUpdateSoftDeactivateAndGracefulDownstreamFailure() throws Exception {
        // 1. Create supplier -> 201 Created, actif = true, normalized email
        FournisseurRequest createReq = new FournisseurRequest(
                "Atlas Fournitures",
                "Contact@Atlas.Example",
                "+212600000000",
                "Agadir, Maroc"
        );

        MvcResult createResult = mockMvc.perform(post("/api/fournisseurs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nom").value("Atlas Fournitures"))
                .andExpect(jsonPath("$.email").value("contact@atlas.example"))
                .andExpect(jsonPath("$.actif").value(true))
                .andReturn();

        FournisseurResponse created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                FournisseurResponse.class
        );
        Long id = created.id();
        assertThat(id).isPositive();

        // 2. Duplicate email (case-insensitive) -> 409 Conflict
        FournisseurRequest duplicateReq = new FournisseurRequest(
                "Autre Société",
                "CONTACT@atlas.example",
                null,
                null
        );
        mockMvc.perform(post("/api/fournisseurs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"));

        // 3. Update supplier -> 200 OK
        FournisseurRequest updateReq = new FournisseurRequest(
                "Atlas Fournitures Maroc",
                "contact@atlas.example",
                "+212528840000",
                "Zone Industrielle Tassila, Agadir"
        );
        mockMvc.perform(put("/api/fournisseurs/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Atlas Fournitures Maroc"))
                .andExpect(jsonPath("$.telephone").value("+212528840000"));

        // 4. Soft-deactivate via PATCH /api/fournisseurs/{id}/desactiver -> 200 OK, actif = false
        mockMvc.perform(patch("/api/fournisseurs/{id}/desactiver", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.actif").value(false));

        // 5. Historical lookup by ID still returns deactivated supplier with actif = false
        mockMvc.perform(get("/api/fournisseurs/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.actif").value(false));

        // 6. Default list excludes inactive suppliers, while ?actif=false or ?includeInactive=true includes them
        mockMvc.perform(get("/api/fournisseurs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/fournisseurs").param("actif", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id));

        mockMvc.perform(get("/api/fournisseurs").param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // 7. Reactivate and soft-deactivate via DELETE /api/fournisseurs/{id} -> 204 No Content
        mockMvc.perform(patch("/api/fournisseurs/{id}/reactiver", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actif").value(true));

        mockMvc.perform(delete("/api/fournisseurs/{id}", id))
                .andExpect(status().isNoContent());

        assertThat(fournisseurRepository.findById(id)).isPresent();
        assertThat(fournisseurRepository.findById(id).orElseThrow().getActif()).isFalse();

        // 8. Calling GET /api/fournisseurs/{id}/commandes when Commandes service is not running -> 503 Service Unavailable
        mockMvc.perform(get("/api/fournisseurs/{id}/commandes", id))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("SERVICE_UNAVAILABLE"));

        // 9. Health endpoint is UP
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void paginatedListAndGlobalStats_shouldFilterAndSortBeforePaginationAndRespectLimits() throws Exception {
        List<Fournisseur> seeds = List.of(
                createEntity("Zeta Transport", "zeta@procuraflow.ma", "Boulevard Zerktouni, Casablanca", true),
                createEntity("alpha Fournitures", "alpha@procuraflow.ma", "Zone Industrielle, Agadir", true),
                createEntity("Beta Textiles", "beta@procuraflow.ma", "Avenue Hassan II, Fès", true),
                createEntity("Delta Energies", "delta@procuraflow.ma", "Quartier Industriel, Fes", true),
                createEntity("Epsilon Medical", "epsilon@procuraflow.ma", "Avenue Mohammed V, Rabat", true),
                createEntity("Gamma Papeterie", "gamma@procuraflow.ma", "Zone Franche, Tanger", true),
                createEntity("Iota Cables", "iota@procuraflow.ma", "Rue de Paris, Casablanca", true),
                createEntity("Kappa Chimie", "kappa@procuraflow.ma", "Boulevard Anfa, Casablanca", true),
                createEntity("Lambda Securite", "lambda@procuraflow.ma", "Avenue Allal El Fassi, Rabat", true),
                createEntity("Mu Mobilier", "mu@procuraflow.ma", "Quartier Sidi Ghanem, Marrakech", true),
                createEntity("Nu Packaging", "nu@procuraflow.ma", "Zone Tassila, Agadir", true),
                createEntity("Omega Outillage", "omega@procuraflow.ma", "Boulevard Pasteur, Tanger", true),
                createEntity("Theta Archives", "theta@procuraflow.ma", "Quartier Agdal, Rabat", false),
                createEntity("Sigma Suspendu", "sigma@procuraflow.ma", "Technopolis, Salé", false)
        );
        fournisseurRepository.saveAllAndFlush(seeds);

        // Page 0 size 10 with default sort nom,asc (case-insensitive) over all statuses
        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(14))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(false))
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.content[0].nom").value("alpha Fournitures"))
                .andExpect(jsonPath("$.content[1].nom").value("Beta Textiles"))
                .andExpect(jsonPath("$.content[9].nom").value("Nu Packaging"));

        // Page 1 returns remaining 4 sorted items ending with Zeta Transport
        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "1")
                        .param("size", "10")
                        .param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.totalElements").value(14))
                .andExpect(jsonPath("$.first").value(false))
                .andExpect(jsonPath("$.last").value(true))
                .andExpect(jsonPath("$.content.length()").value(4))
                .andExpect(jsonPath("$.content[0].nom").value("Omega Outillage"))
                .andExpect(jsonPath("$.content[3].nom").value("Zeta Transport"));

        // Sorting nom,desc happens globally before slicing
        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "0")
                        .param("size", "25")
                        .param("sort", "nom,desc")
                        .param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content.length()").value(14))
                .andExpect(jsonPath("$.content[0].nom").value("Zeta Transport"))
                .andExpect(jsonPath("$.content[13].nom").value("alpha Fournitures"));

        // Filtering (search & accent-insensitive ville) happens before pagination
        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("ville", "Fès")
                        .param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content[0].nom").value("Beta Textiles"))
                .andExpect(jsonPath("$.content[1].nom").value("Delta Energies"));

        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("actif", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].nom").value("Sigma Suspendu"))
                .andExpect(jsonPath("$.content[1].nom").value("Theta Archives"));

        // Size > 50 and unknown sort rejected with 400
        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "0")
                        .param("size", "51"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/fournisseurs")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "unknownCol,asc"))
                .andExpect(status().isBadRequest());

        // Global stats endpoint reflects entire DB regardless of current page
        mockMvc.perform(get("/api/fournisseurs/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(14))
                .andExpect(jsonPath("$.actifs").value(12))
                .andExpect(jsonPath("$.inactifs").value(2))
                .andExpect(jsonPath("$.tauxEligibilite").value(86))
                .andExpect(jsonPath("$.villes.length()").isNumber());

        // Legacy unpaginated endpoint still returns JSON array for existing microservice integrations
        mockMvc.perform(get("/api/fournisseurs").param("includeInactive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(14));

        // Unpaginated endpoint also supports search, ville and sort for Map View and full Exports
        mockMvc.perform(get("/api/fournisseurs")
                        .param("includeInactive", "true")
                        .param("ville", "Fès")
                        .param("sort", "nom,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nom").value("Delta Energies"))
                .andExpect(jsonPath("$[1].nom").value("Beta Textiles"));

        // OpenAPI docs remain healthy with both paginated & unpaginated routes
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/fournisseurs']").exists())
                .andExpect(jsonPath("$.paths['/api/fournisseurs/stats']").exists());
    }

    private static Fournisseur createEntity(String nom, String email, String adresse, boolean actif) {
        Fournisseur f = new Fournisseur(nom, email, "+212500000000", adresse);
        f.setActif(actif);
        return f;
    }
}
