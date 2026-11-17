package com.procuraflow.receptions.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "receptions", schema = "schema_receptions")
public class Reception {

    @Id
    private Long  id;

    @Column(name = "commande_id", nullable = false)
    private Long commandeId;

    @Column(name = "date_reception")
    private LocalDateTime dateReception;

    private String remarques;

    @Column(name = "statut_reception", length = 30)
    private String statutReception;

    protected Reception() {
    }

    public Long  getId() {
        return id;
    }

    public Long getCommandeId() {
        return commandeId;
    }

    public LocalDateTime getDateReception() {
        return dateReception;
    }

    public String getRemarques() {
        return remarques;
    }

    public String getStatutReception() {
        return statutReception;
    }
}