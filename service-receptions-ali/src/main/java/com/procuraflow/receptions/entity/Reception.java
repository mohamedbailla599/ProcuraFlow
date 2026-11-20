package com.procuraflow.receptions.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "receptions", schema = "schema_receptions")
public class Reception {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "commande_id", nullable = false)
    private Long commandeId;
    @Column(name = "date_reception")
    private OffsetDateTime dateReception;
    private String remarques;
    @Column(name = "statut_reception", length = 30)
    private String statutReception;
    @Column(name = "cle_creation")
    private UUID cleCreation;
    @OneToMany(mappedBy = "reception", cascade = CascadeType.PERSIST)
    @org.hibernate.annotations.BatchSize(size = 100)
    @OrderBy("id")
    private List<LigneReception> lignes = new ArrayList<>();

    protected Reception() {}

    public Reception(Long commandeId, UUID cleCreation, String remarques) {
        this.commandeId = commandeId;
        this.cleCreation = cleCreation;
        this.remarques = remarques;
        this.dateReception = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MICROS);
        this.statutReception = "CONFORME";
    }

    public void ajouterLigne(Long ligneCommandeId, int quantiteRecue, String remarque) {
        lignes.add(new LigneReception(this, ligneCommandeId, quantiteRecue, remarque));
    }

    public Long getId() { return id; }
    public Long getCommandeId() { return commandeId; }
    public OffsetDateTime getDateReception() { return dateReception; }
    public String getRemarques() { return remarques; }
    public String getStatutReception() { return statutReception; }
    public List<LigneReception> getLignes() { return lignes; }
}
