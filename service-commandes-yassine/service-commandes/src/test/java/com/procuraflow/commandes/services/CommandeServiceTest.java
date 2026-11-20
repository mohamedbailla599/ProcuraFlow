package com.procuraflow.commandes.services;

import com.procuraflow.commandes.entities.Commande;
import com.procuraflow.commandes.entities.StatutCommande;
import com.procuraflow.commandes.repositories.CommandeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommandeServiceTest {

    @Mock
    private CommandeRepository commandeRepository;

    @InjectMocks
    private CommandeService commandeService;

    private Commande commande;

    @BeforeEach
    void setUp() {
        commande = new Commande();
        commande.setId(1L);
        commande.setFournisseurId(1L);
        commande.setMontantTotal(1500.00);
        commande.setStatut(StatutCommande.EN_ATTENTE);
    }

    @Test
    void testGetAllCommandes() {
        // Given
        when(commandeRepository.findAll()).thenReturn(Arrays.asList(commande));

        // When
        List<Commande> commandes = commandeService.getAllCommandes();

        // Then
        assertThat(commandes).isNotNull();
        assertThat(commandes).hasSize(1);
        assertThat(commandes.get(0).getMontantTotal()).isEqualTo(1500.00);
        verify(commandeRepository, times(1)).findAll();
    }

    @Test
    void testGetCommandeById() {
        // Given
        when(commandeRepository.findById(1L)).thenReturn(Optional.of(commande));

        // When
        Optional<Commande> result = commandeService.getCommandeById(1L);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
        verify(commandeRepository, times(1)).findById(1L);
    }

    @Test
    void testCreerCommande() {
        // Given
        when(commandeRepository.save(any(Commande.class))).thenReturn(commande);

        // When
        Commande savedCommande = commandeService.creerCommande(commande);

        // Then
        assertThat(savedCommande).isNotNull();
        assertThat(savedCommande.getMontantTotal()).isEqualTo(1500.00);
        verify(commandeRepository, times(1)).save(commande);
    }
}