package com.sentrix.repository;

import com.sentrix.entity.AuditLog;
import com.sentrix.enums.AuditDecision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    Page<AuditLog> findByOrganizationIdAndAgentIdOrderByCreatedAtDesc(UUID organizationId, UUID agentId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId ORDER BY a.createdAt DESC LIMIT 1")
    Optional<AuditLog> findLatestByOrganizationId(UUID orgId);

    long countByOrganizationIdAndDecision(UUID organizationId, AuditDecision decision);

    long countByOrganizationIdAndCreatedAtAfter(UUID organizationId, Instant after);

    @Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId ORDER BY a.createdAt ASC")
    List<AuditLog> findAllByOrganizationIdOrderByCreatedAtAsc(UUID orgId);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.organization.id = :orgId AND a.createdAt >= :start AND a.createdAt < :end AND (a.decision = 'DENIED' OR a.riskScore >= 0.80)")
    long countAnomalies(UUID orgId, Instant start, Instant end);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "SET LOCAL app.audit_retention_delete = 'true'", nativeQuery = true)
    void enableAuditRetentionDelete();

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM AuditLog a WHERE a.organization.id = :orgId AND a.createdAt < :cutoff")
    int deleteLogsOlderThan(UUID orgId, Instant cutoff);
}
