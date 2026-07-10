package com.sentrix.repository;

import com.sentrix.entity.BehavioralEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface BehavioralEventRepository extends JpaRepository<BehavioralEvent, UUID> {

    @Query("SELECT b FROM BehavioralEvent b WHERE b.agentId = :agentId AND b.createdAt > :since ORDER BY b.createdAt DESC")
    List<BehavioralEvent> findRecentByAgentId(UUID agentId, Instant since, Pageable pageable);

    long countByAgentIdAndCreatedAtAfter(UUID agentId, Instant after);
}
