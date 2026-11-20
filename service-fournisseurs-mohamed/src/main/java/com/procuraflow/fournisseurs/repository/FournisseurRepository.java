package com.procuraflow.fournisseurs.repository;

import com.procuraflow.fournisseurs.entity.Fournisseur;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FournisseurRepository
        extends JpaRepository<Fournisseur, Long>, JpaSpecificationExecutor<Fournisseur> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    Optional<Fournisseur> findByEmailIgnoreCase(String email);

    long countByActifTrue();

    @Query("SELECT DISTINCT f.adresse FROM Fournisseur f WHERE f.adresse IS NOT NULL")
    List<String> findDistinctNonNullAdresses();
}
