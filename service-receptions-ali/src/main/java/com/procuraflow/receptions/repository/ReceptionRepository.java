package com.procuraflow.receptions.repository;

import com.procuraflow.receptions.entity.Reception;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReceptionRepository extends JpaRepository<Reception, Long> {
    @Query("""
            select distinct r from Reception r left join fetch r.lignes
            where (:commandeId is null or r.commandeId = :commandeId)
            order by r.dateReception desc nulls last, r.id desc
            """)
    List<Reception> consulter(@Param("commandeId") Long commandeId);

    Optional<Reception> findByCleCreation(UUID cleCreation);

    @Query("""
            select r from Reception r
            where (:commandeId is null or r.commandeId = :commandeId)
            order by r.dateReception desc nulls last, r.id desc
            """)
    Page<Reception> consulterPage(@Param("commandeId") Long commandeId, Pageable pageable);
}
