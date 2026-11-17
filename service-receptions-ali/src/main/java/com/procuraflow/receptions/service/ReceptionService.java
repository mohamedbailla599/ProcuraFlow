package com.procuraflow.receptions.service;

import com.procuraflow.receptions.client.CommandesClient;
import com.procuraflow.receptions.dto.ReceptionRequest;
import com.procuraflow.receptions.dto.ReceptionResponse;
import com.procuraflow.receptions.entity.Reception;
import com.procuraflow.receptions.repository.ReceptionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import static org.springframework.http.HttpStatus.*;

@Service
@Transactional(readOnly = true)
public class ReceptionService {
    private final ReceptionRepository repository;
    private final CommandesClient commandes;
    private final JdbcTemplate jdbc;

    public ReceptionService(ReceptionRepository repository, CommandesClient commandes, JdbcTemplate jdbc) {
        this.repository = repository;
        this.commandes = commandes;
        this.jdbc = jdbc;
    }

    public List<ReceptionResponse> list(Long commandeId) {
        return repository.consulter(commandeId).stream().map(ReceptionResponse::from).toList();
    }

    public Optional<ReceptionResponse> findById(Long id) {
        return repository.findById(id).map(ReceptionResponse::from);
    }

    public record PageReceptions(List<ReceptionResponse> contenu, int nombrePages) {}

    public PageReceptions page(Long commandeId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(BAD_REQUEST, "Page à partir de zéro, taille entre 1 et 100.");
        }
        var result = repository.consulterPage(commandeId, PageRequest.of(page, size));
        return new PageReceptions(result.map(ReceptionResponse::from).getContent(), result.getTotalPages());
    }

    public record Solde(Long ligneCommandeId, String designation, int quantiteCommandee, long restante) {}

    public List<Solde> soldes(Long commandeId) {
        var commande = commandes.obtenirCommande(commandeId);
        if (!"VALIDEE".equals(commande.statut()) && !"EXPEDIEE".equals(commande.statut())) {
            throw new ResponseStatusException(CONFLICT, "La commande doit être validée ou expédiée.");
        }
        Map<Long, Long> cumuls = new HashMap<>();
        for (var reception : repository.consulter(commandeId)) {
            if (reception.getLignes().isEmpty()) {
                throw new ResponseStatusException(CONFLICT, "Une réception historique sans lignes empêche de calculer le restant.");
            }
            for (var ligne : reception.getLignes()) {
                cumuls.merge(ligne.getLigneCommandeId(), (long) ligne.getQuantiteRecue(), Long::sum);
            }
        }
        if (commande.lignesCommande() == null) {
            throw new ResponseStatusException(BAD_GATEWAY, "La réponse de Commandes ne contient pas les lignes.");
        }
        List<Solde> resultat = new ArrayList<>();
        Set<Long> ids = new HashSet<>();
        for (var ligne : commande.lignesCommande()) {
            if (ligne == null || ligne.id() == null || !ids.add(ligne.id()) || ligne.quantite() == null || ligne.quantite() <= 0) {
                throw new ResponseStatusException(BAD_GATEWAY, "Le service Commandes a retourné une ligne invalide.");
            }
            long restante = ligne.quantite() - cumuls.getOrDefault(ligne.id(), 0L);
            resultat.add(new Solde(ligne.id(), ligne.designation(), ligne.quantite(), Math.max(0, restante)));
        }
        return resultat;
    }

    public record Creation(ReceptionResponse reception, boolean nouvelle) {}

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Creation creer(ReceptionRequest demande) {
        if (demande.cleCreation() == null || demande.commandeId() == null || demande.commandeId() <= 0
                || demande.lignes() == null || demande.lignes().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Indiquez une clé de création, une commande et au moins une ligne.");
        }
        Map<Long, ReceptionRequest.Ligne> selection = new HashMap<>();
        for (var ligne : demande.lignes()) {
            if (ligne == null || ligne.ligneCommandeId() == null || ligne.ligneCommandeId() <= 0
                    || ligne.quantiteRecue() == null || ligne.quantiteRecue() <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Chaque ligne doit avoir un identifiant et une quantité positive.");
            }
            if (selection.put(ligne.ligneCommandeId(), ligne) != null) {
                throw new ResponseStatusException(BAD_REQUEST, "La même ligne figure deux fois dans la livraison.");
            }
        }

        // Two separate PostgreSQL lock namespaces. Always acquire the retry key before the order.
        verrouiller("receptions.creation", demande.cleCreation().toString());
        var precedente = repository.findByCleCreation(demande.cleCreation());
        if (precedente.isPresent()) {
            var reception = precedente.get();
            boolean identique = reception.getCommandeId().equals(demande.commandeId())
                    && Objects.equals(reception.getRemarques(), demande.remarques())
                    && reception.getLignes().size() == selection.size()
                    && reception.getLignes().stream().allMatch(ligne ->
                        new ReceptionRequest.Ligne(ligne.getLigneCommandeId(), ligne.getQuantiteRecue(), ligne.getRemarques())
                            .equals(selection.get(ligne.getLigneCommandeId())));
            if (!identique) {
                throw new ResponseStatusException(CONFLICT, "Cette clé correspond déjà à une autre livraison.");
            }
            return new Creation(ReceptionResponse.from(reception), false);
        }

        verrouiller("receptions.commande", demande.commandeId().toString());
        Map<Long, Long> restantes = new HashMap<>();
        soldes(demande.commandeId()).forEach(ligne -> restantes.put(ligne.ligneCommandeId(), ligne.restante()));
        var reception = new Reception(demande.commandeId(), demande.cleCreation(), demande.remarques());
        for (var ligne : demande.lignes()) {
            Long reste = restantes.get(ligne.ligneCommandeId());
            if (reste == null) {
                throw new ResponseStatusException(BAD_REQUEST, "La ligne " + ligne.ligneCommandeId() + " est absente de la commande.");
            }
            if (ligne.quantiteRecue() > reste) {
                throw new ResponseStatusException(CONFLICT, "Ligne " + ligne.ligneCommandeId() + " : il reste " + reste + " unité(s).");
            }
            reception.ajouterLigne(ligne.ligneCommandeId(), ligne.quantiteRecue(), ligne.remarques());
        }
        return new Creation(ReceptionResponse.from(repository.saveAndFlush(reception)), true);
    }

    private void verrouiller(String domaine, String valeur) {
        jdbc.query("select pg_advisory_xact_lock(hashtext(?), hashtext(?))",
                (rs, index) -> Boolean.TRUE, domaine, valeur);
    }
}
