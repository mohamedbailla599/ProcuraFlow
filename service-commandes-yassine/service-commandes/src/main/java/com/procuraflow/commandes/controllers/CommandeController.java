package com.procuraflow.commandes.controllers;

import com.procuraflow.commandes.entities.Commande;
import com.procuraflow.commandes.entities.StatutCommande;
import com.procuraflow.commandes.services.CommandeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/commandes")
public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    @GetMapping
    public List<Commande> listerCommandes() {
        return commandeService.getAllCommandes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Commande> obtenirCommandeParId(@PathVariable Long id) {
        return commandeService.getCommandeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Commande creerCommande(@RequestBody Commande commande) {
        return commandeService.creerCommande(commande);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerCommande(@PathVariable Long id) {
        if (commandeService.getCommandeById(id).isPresent()) {
            commandeService.supprimerCommande(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    @PutMapping("/{id}/statut")
    public ResponseEntity<Commande> modifierStatutCommande(
            @PathVariable Long id, 
            @RequestParam StatutCommande statut) {
        Commande commandeMaj = commandeService.updateStatutCommande(id, statut);
        return ResponseEntity.ok(commandeMaj);
    }
    @GetMapping("/fournisseur/{fournisseurId}")
    public ResponseEntity<List<Commande>> getCommandesByFournisseur(@PathVariable Long fournisseurId) {
        List<Commande> commandes = commandeService.getCommandesByFournisseur(fournisseurId);
        return ResponseEntity.ok(commandes);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Commande> modifierCommande(
            @PathVariable Long id,
            @RequestBody Commande commandeDetails) {
        Commande commandeMaj = commandeService.modifierCommande(id, commandeDetails);
        return ResponseEntity.ok(commandeMaj);
    }
}