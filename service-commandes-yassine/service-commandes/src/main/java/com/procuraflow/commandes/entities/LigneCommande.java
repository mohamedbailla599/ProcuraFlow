package com.procuraflow.commandes.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "lignes_commande", schema = "schema_commandes")
public class LigneCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "designation", nullable = false)
    private String designation;

    @Column(name = "quantite", nullable = false)
    private int quantite;

    @Column(name = "prix_unitaire", nullable = false)
    private double prixUnitaire;

    @ManyToOne
    @JoinColumn(name = "commande_id")
    @com.fasterxml.jackson.annotation.JsonBackReference
    private Commande commande;

    // Constructeur par défaut
    public LigneCommande() {
    }

    // Constructeur avec arguments
    public LigneCommande(Long id, String designation, int quantite, double prixUnitaire, Commande commande) {
        this.id = id;
        this.designation = designation;
        this.quantite = quantite;
        this.prixUnitaire = prixUnitaire;
        this.commande = commande;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public double getPrixUnitaire() {
        return prixUnitaire;
    }

    public void setPrixUnitaire(double prixUnitaire) {
        this.prixUnitaire = prixUnitaire;
    }

    public Commande getCommande() {
        return commande;
    }

    public void setCommande(Commande commande) {
        this.commande = commande;
    }
}