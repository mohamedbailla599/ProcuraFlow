package com.procuraflow.fournisseurs.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.procuraflow.fournisseurs.client.CommandesClient;
import com.procuraflow.fournisseurs.dto.CommandeSummaryResponse;
import com.procuraflow.fournisseurs.dto.FournisseurRequest;
import com.procuraflow.fournisseurs.dto.FournisseurResponse;
import com.procuraflow.fournisseurs.dto.FournisseurStatsResponse;
import com.procuraflow.fournisseurs.dto.PageResponse;
import com.procuraflow.fournisseurs.entity.Fournisseur;
import com.procuraflow.fournisseurs.exception.DuplicateEmailException;
import com.procuraflow.fournisseurs.exception.FournisseurNotFoundException;
import com.procuraflow.fournisseurs.repository.FournisseurRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class FournisseurServiceTest {

    @Mock
    private FournisseurRepository fournisseurRepository;

    @Mock
    private CommandesClient commandesClient;

    @InjectMocks
    private FournisseurService fournisseurService;

    @Test
    void createFournisseur_shouldNormalizeEmailAndSetActifTrue() {
        FournisseurRequest request = new FournisseurRequest(
                "  Atlas Fournitures  ",
                "  Contact@Atlas.Example ",
                "+212600000000",
                "Agadir, Maroc"
        );

        when(fournisseurRepository.existsByEmailIgnoreCase("contact@atlas.example")).thenReturn(false);
        when(fournisseurRepository.saveAndFlush(any(Fournisseur.class))).thenAnswer(invocation -> {
            Fournisseur f = invocation.getArgument(0);
            f.setId(12L);
            f.onPrePersist();
            return f;
        });

        FournisseurResponse response = fournisseurService.createFournisseur(request);

        assertThat(response.id()).isEqualTo(12L);
        assertThat(response.nom()).isEqualTo("Atlas Fournitures");
        assertThat(response.email()).isEqualTo("contact@atlas.example");
        assertThat(response.actif()).isTrue();
        assertThat(response.createdAt()).isNotNull();
        assertThat(response.updatedAt()).isNotNull();

        ArgumentCaptor<Fournisseur> captor = ArgumentCaptor.forClass(Fournisseur.class);
        verify(fournisseurRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getActif()).isTrue();
    }

    @Test
    void createFournisseur_shouldThrowDuplicateEmailExceptionWhenEmailExists() {
        FournisseurRequest request = new FournisseurRequest(
                "Atlas Fournitures",
                "contact@atlas.example",
                null,
                null
        );

        when(fournisseurRepository.existsByEmailIgnoreCase("contact@atlas.example")).thenReturn(true);

        assertThatThrownBy(() -> fournisseurService.createFournisseur(request))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessageContaining("contact@atlas.example");

        verify(fournisseurRepository, never()).saveAndFlush(any());
    }

    @Test
    void getFournisseurById_shouldReturnSupplierWhenExists() {
        Fournisseur entity = buildEntity(5L, "Maroc Bureau", "info@marocbureau.ma", true);
        when(fournisseurRepository.findById(5L)).thenReturn(Optional.of(entity));

        FournisseurResponse response = fournisseurService.getFournisseurById(5L);

        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.nom()).isEqualTo("Maroc Bureau");
        assertThat(response.email()).isEqualTo("info@marocbureau.ma");
    }

    @Test
    void getFournisseurById_shouldThrowNotFoundWhenMissing() {
        when(fournisseurRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fournisseurService.getFournisseurById(999L))
                .isInstanceOf(FournisseurNotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    void updateFournisseur_shouldUpdateFieldsAndPreserveActifStatus() {
        Fournisseur existing = buildEntity(10L, "Ancien Nom", "ancien@example.com", false);
        FournisseurRequest updateRequest = new FournisseurRequest(
                "Nouveau Nom",
                "NOUVEAU@example.com",
                "+212528000000",
                "Casablanca"
        );

        when(fournisseurRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(fournisseurRepository.existsByEmailIgnoreCaseAndIdNot("nouveau@example.com", 10L)).thenReturn(false);
        when(fournisseurRepository.saveAndFlush(any(Fournisseur.class))).thenAnswer(inv -> {
            Fournisseur f = inv.getArgument(0);
            f.onPreUpdate();
            return f;
        });

        FournisseurResponse updated = fournisseurService.updateFournisseur(10L, updateRequest);

        assertThat(updated.id()).isEqualTo(10L);
        assertThat(updated.nom()).isEqualTo("Nouveau Nom");
        assertThat(updated.email()).isEqualTo("nouveau@example.com");
        assertThat(updated.telephone()).isEqualTo("+212528000000");
        assertThat(updated.adresse()).isEqualTo("Casablanca");
        assertThat(updated.actif()).isFalse();
    }

    @Test
    void updateFournisseur_shouldRejectDuplicateEmailBelongingToAnotherSupplier() {
        Fournisseur existing = buildEntity(10L, "Nom", "actuel@example.com", true);
        FournisseurRequest updateRequest = new FournisseurRequest(
                "Nom",
                "pris@example.com",
                null,
                null
        );

        when(fournisseurRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(fournisseurRepository.existsByEmailIgnoreCaseAndIdNot("pris@example.com", 10L)).thenReturn(true);

        assertThatThrownBy(() -> fournisseurService.updateFournisseur(10L, updateRequest))
                .isInstanceOf(DuplicateEmailException.class);

        verify(fournisseurRepository, never()).saveAndFlush(any());
    }

    @Test
    void deactivateFournisseur_shouldPerformSoftDeactivationWithoutDeletingRecord() {
        Fournisseur existing = buildEntity(7L, "Souss Equipement", "contact@souss.ma", true);
        when(fournisseurRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(fournisseurRepository.saveAndFlush(any(Fournisseur.class))).thenAnswer(inv -> inv.getArgument(0));

        FournisseurResponse deactivated = fournisseurService.deactivateFournisseur(7L);

        assertThat(deactivated.id()).isEqualTo(7L);
        assertThat(deactivated.actif()).isFalse();
        verify(fournisseurRepository, never()).delete(any(Fournisseur.class));
        verify(fournisseurRepository, never()).deleteById(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void listFournisseurs_shouldReturnMappedSuppliers() {
        Fournisseur f1 = buildEntity(1L, "Atlas", "a@atlas.ma", true);
        when(fournisseurRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(f1));

        List<FournisseurResponse> result = fournisseurService.listFournisseurs(true, "Atlas", null, false);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nom()).isEqualTo("Atlas");
    }

    @Test
    @SuppressWarnings("unchecked")
    void listFournisseurs_withSearchVilleAndSort_shouldApplyRequestedSort() {
        Fournisseur f1 = buildEntity(2L, "Zeta", "z@fes.ma", true);
        when(fournisseurRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(f1));

        List<FournisseurResponse> result = fournisseurService.listFournisseurs(
                null, "fes", null, null, "Fès", true, "nom,desc"
        );

        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(fournisseurRepository).findAll(any(Specification.class), sortCaptor.capture());
        Sort.Order nomOrder = sortCaptor.getValue().getOrderFor("nom");
        assertThat(nomOrder).isNotNull();
        assertThat(nomOrder.getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(nomOrder.isIgnoreCase()).isTrue();
        assertThat(result).hasSize(1);
    }

    @Test
    void getCommandesByFournisseurId_shouldVerifySupplierExistsAndCallCommandesClient() {
        when(fournisseurRepository.existsById(12L)).thenReturn(true);
        List<CommandeSummaryResponse> expectedOrders = List.of(
                new CommandeSummaryResponse(101L, 12L, "2026-10-15T10:30:00Z", "VALIDEE", new BigDecimal("450.00"))
        );
        when(commandesClient.getCommandesByFournisseurId(12L)).thenReturn(expectedOrders);

        List<CommandeSummaryResponse> result = fournisseurService.getCommandesByFournisseurId(12L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(101L);
        assertThat(result.get(0).fournisseurId()).isEqualTo(12L);
        verify(commandesClient).getCommandesByFournisseurId(eq(12L));
    }

    @Test
    void getCommandesByFournisseurId_shouldThrowNotFoundAndNotCallDownstreamWhenSupplierMissing() {
        when(fournisseurRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> fournisseurService.getCommandesByFournisseurId(404L))
                .isInstanceOf(FournisseurNotFoundException.class);

        verify(commandesClient, never()).getCommandesByFournisseurId(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void listFournisseursPaginated_shouldDefaultSortByNomAscWithIdTieBreakerAndMapMetadata() {
        Fournisseur f1 = buildEntity(1L, "Alpha Industriel", "alpha@example.com", true);
        Fournisseur f2 = buildEntity(2L, "Zeta Logistique", "zeta@example.com", true);
        Pageable expectedPageable = PageRequest.of(0, 10);
        Page<Fournisseur> repoPage = new PageImpl<>(List.of(f1, f2), expectedPageable, 24L);

        when(fournisseurRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(repoPage);

        PageResponse<FournisseurResponse> result = fournisseurService.listFournisseursPaginated(
                null, "Industriel", null, null, null, true, 0, 10, null
        );

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(fournisseurRepository).findAll(any(Specification.class), pageableCaptor.capture());

        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getPageNumber()).isEqualTo(0);
        assertThat(captured.getPageSize()).isEqualTo(10);
        Sort.Order nomOrder = captured.getSort().getOrderFor("nom");
        Sort.Order idOrder = captured.getSort().getOrderFor("id");
        assertThat(nomOrder).isNotNull();
        assertThat(nomOrder.getDirection()).isEqualTo(Sort.Direction.ASC);
        assertThat(nomOrder.isIgnoreCase()).isTrue();
        assertThat(idOrder).isNotNull();
        assertThat(idOrder.getDirection()).isEqualTo(Sort.Direction.ASC);

        assertThat(result.content()).hasSize(2);
        assertThat(result.page()).isZero();
        assertThat(result.size()).isEqualTo(10);
        assertThat(result.totalElements()).isEqualTo(24L);
        assertThat(result.totalPages()).isEqualTo(3);
        assertThat(result.first()).isTrue();
        assertThat(result.last()).isFalse();
        assertThat(result.empty()).isFalse();
    }

    @Test
    void listFournisseursPaginated_shouldRejectInvalidPageSizeAndSort() {
        assertThatThrownBy(() -> fournisseurService.listFournisseursPaginated(
                null, null, null, null, null, true, -1, 10, "nom,asc"
        )).isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> fournisseurService.listFournisseursPaginated(
                null, null, null, null, null, true, 0, 0, "nom,asc"
        )).isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> fournisseurService.listFournisseursPaginated(
                null, null, null, null, null, true, 0, 51, "nom,asc"
        )).isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> fournisseurService.listFournisseursPaginated(
                null, null, null, null, null, true, 0, 10, "motDePasse,asc"
        )).isInstanceOf(IllegalArgumentException.class);

        verify(fournisseurRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getGlobalStats_shouldComputeCountsEligibilityAndSortedNormalizedCities() {
        when(fournisseurRepository.count()).thenReturn(15L);
        when(fournisseurRepository.countByActifTrue()).thenReturn(12L);
        when(fournisseurRepository.findDistinctNonNullAdresses()).thenReturn(List.of(
                "Avenue Hassan II, Fes, Maroc",
                "Zone Industrielle, Casablanca",
                "Quartier Administratif, Agadir"
        ));

        FournisseurStatsResponse stats = fournisseurService.getGlobalStats();

        assertThat(stats.total()).isEqualTo(15L);
        assertThat(stats.actifs()).isEqualTo(12L);
        assertThat(stats.inactifs()).isEqualTo(3L);
        assertThat(stats.tauxEligibilite()).isEqualTo(80);
        assertThat(stats.villes()).containsExactly("Agadir", "Casablanca", "Fès");
    }

    private static Fournisseur buildEntity(Long id, String nom, String email, boolean actif) {
        Fournisseur f = new Fournisseur(nom, email, "+212600000000", "Agadir");
        f.setId(id);
        f.setActif(actif);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        f.setCreatedAt(now);
        f.setUpdatedAt(now);
        return f;
    }
}
