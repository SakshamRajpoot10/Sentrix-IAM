package com.sentrix.entity;

import com.sentrix.enums.AuditDecision;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Immutable audit log entry with SHA-256 hash chain.
 * Protected by PostgreSQL triggers that block UPDATE and DELETE.
 */
@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"organization"})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "agent_id")
    private UUID agentId;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(nullable = false)
    private String action;

    @Column
    private String resource;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditDecision decision;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "policy_id")
    private UUID policyId;

    @Column
    private String reason;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_context", columnDefinition = "jsonb")
    private Map<String, Object> requestContext;

    @Column(nullable = false, length = 64)
    private String hash;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;
}
