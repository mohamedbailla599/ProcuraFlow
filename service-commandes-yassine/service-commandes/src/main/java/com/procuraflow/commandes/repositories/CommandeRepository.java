package com.procuraflow.commandes.repositories;

import com.procuraflow.commandes.entities.Commande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {
    
    // Méthode de recherche par fournisseurId
    List<Commande> findByFournisseurId(Long fournisseurId);
}