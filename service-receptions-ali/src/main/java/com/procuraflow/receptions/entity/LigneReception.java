package com.procuraflow.receptions.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lignes_reception", schema = "schema_receptions")
public class LigneReception {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reception_id")
    private Reception reception;
    @Column(name = "ligne_commande_id", nullable = false)
    private Long ligneCommandeId;
    @Column(name = "quantite_recue", nullable = false)
    private int quantiteRecue;
    private String remarques;

    protected LigneReception() {}

    LigneReception(Reception reception, Long ligneCommandeId, int quantiteRecue, String remarques) {
        this.reception = reception;
        this.ligneCommandeId = ligneCommandeId;
        this.quantiteRecue = quantiteRecue;
        this.remarques = remarques;
    }
    public Long getId() { return id; }
    public Long getLigneCommandeId() { return ligneCommandeId; }
    public int getQuantiteRecue() { return quantiteRecue; }
    public String getRemarques() { return remarques; }
}

