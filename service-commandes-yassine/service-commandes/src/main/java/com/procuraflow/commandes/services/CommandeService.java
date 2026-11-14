package com.procuraflow.commandes.services;

import com.procuraflow.commandes.entities.Commande;
import com.procuraflow.commandes.entities.LigneCommande;
import com.procuraflow.commandes.entities.StatutCommande;
import com.procuraflow.commandes.repositories.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CommandeService {

    @Autowired
    private CommandeRepository commandeRepository;

    public List<Commande> getAllCommandes() {
        return commandeRepository.findAll();
    }

    public Optional<Commande> getCommandeById(Long id) {
        return commandeRepository.findById(id);
    }

    @Transactional
    public Commande creerCommande(Commande commande) {
        commande.setDateCommande(LocalDateTime.now());
        if (commande.getStatut() == null) {
            commande.setStatut(com.procuraflow.commandes.entities.StatutCommande.EN_ATTENTE);
        }
        
        // Associer chaque ligne de commande à la commande parente (indispensable pour JPA)
        if (commande.getLignesCommande() != null) {
            for (LigneCommande ligne : commande.getLignesCommande()) {
                ligne.setCommande(commande);
            }
        }
        
        return commandeRepository.save(commande);
    }

    public void supprimerCommande(Long id) {
        commandeRepository.deleteById(id);
    }
    public Commande updateStatutCommande(Long id, StatutCommande nouveauStatut) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id : " + id));
        
        commande.setStatut(nouveauStatut);
        return commandeRepository.save(commande);
    }
    public List<Commande> getCommandesByFournisseur(Long fournisseurId) {
        return commandeRepository.findByFournisseurId(fournisseurId);
    }
    @Transactional
    public Commande modifierCommande(Long id, Commande commandeDetails) {
        Commande commande = commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'id : " + id));

        if (commandeDetails.getFournisseurId() != null) {
            commande.setFournisseurId(commandeDetails.getFournisseurId());
        }
        if (commandeDetails.getStatut() != null) {
            commande.setStatut(commandeDetails.getStatut());
        }

        // Mettre à jour les lignes de commande si fournies
        if (commandeDetails.getLignesCommande() != null) {
            commande.getLignesCommande().clear();
            for (LigneCommande ligne : commandeDetails.getLignesCommande()) {
                ligne.setCommande(commande);
                commande.getLignesCommande().add(ligne);
            }
        }

        return commandeRepository.save(commande);
    }
}