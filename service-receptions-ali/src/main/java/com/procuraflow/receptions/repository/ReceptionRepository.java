package com.procuraflow.receptions.repository;

import com.procuraflow.receptions.entity.Reception;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReceptionRepository extends JpaRepository<Reception, Long> {

    @Query("""
            select r from Reception r
            order by r.dateReception desc nulls last, r.id desc
            """)
    List<Reception> findAllMostRecentFirst();
}