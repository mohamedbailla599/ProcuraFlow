package com.procuraflow.commandes.controllers;

import com.procuraflow.commandes.entities.Commande;
import com.procuraflow.commandes.entities.StatutCommande;
import com.procuraflow.commandes.services.CommandeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CommandeControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CommandeService commandeService;

    @InjectMocks
    private CommandeController commandeController;

    @BeforeEach
    void setUp() {
        // Initialisation autonome du contrôleur sans charger tout le contexte Spring Boot
        mockMvc = MockMvcBuilders.standaloneSetup(commandeController).build();
    }

    @Test
    void testListerCommandes() throws Exception {
        Commande commande = new Commande();
        commande.setId(1L);
        commande.setMontantTotal(1500.00);
        commande.setStatut(StatutCommande.EN_ATTENTE);

        when(commandeService.getAllCommandes()).thenReturn(Collections.singletonList(commande));

        mockMvc.perform(get("/api/commandes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].montantTotal").value(1500.00));
    }

    @Test
    void testObtenirCommandeParId() throws Exception {
        Commande commande = new Commande();
        commande.setId(1L);
        commande.setMontantTotal(1500.00);

        when(commandeService.getCommandeById(1L)).thenReturn(Optional.of(commande));

        mockMvc.perform(get("/api/commandes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void testCreerCommande() throws Exception {
        Commande commande = new Commande();
        commande.setId(1L);
        commande.setMontantTotal(2400.00);

        when(commandeService.creerCommande(any(Commande.class))).thenReturn(commande);

        // JSON brut pour éviter d'avoir besoin de ObjectMapper
        String jsonBody = "{\"id\":1,\"montantTotal\":2400.00}";

        mockMvc.perform(post("/api/commandes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.montantTotal").value(2400.00));
    }
}