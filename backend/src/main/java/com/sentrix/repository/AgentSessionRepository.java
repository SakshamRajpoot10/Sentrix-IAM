package com.sentrix.repository;

import com.sentrix.entity.AgentSession;
import com.sentrix.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentSessionRepository extends JpaRepository<AgentSession, UUID> {

    Optional<AgentSession> findByTokenHash(String tokenHash);

    long countByAgentIdAndStatus(UUID agentId, SessionStatus status);

    @Modifying
    @Query("UPDATE AgentSession s SET s.status = 'REVOKED' WHERE s.agent.id = :agentId AND s.status = 'ACTIVE'")
    void revokeAllActiveSessions(UUID agentId);

    @Modifying
    @Query("UPDATE AgentSession s SET s.status = 'EXPIRED' WHERE s.expiresAt < :now AND s.status = 'ACTIVE'")
    void expireOldSessions(Instant now);
}
