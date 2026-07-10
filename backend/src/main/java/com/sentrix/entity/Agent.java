package com.sentrix.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sentrix.enums.AgentStatus;
import com.sentrix.enums.AgentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "agents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"apiKeyHash", "organization", "policies", "sessions"})
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AgentType type = AgentType.AUTONOMOUS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AgentStatus status = AgentStatus.ACTIVE;

    @JsonIgnore
    @Column(name = "api_key_hash", nullable = false, unique = true)
    private String apiKeyHash;

    @Column(name = "api_key_prefix", nullable = false)
    private String apiKeyPrefix;

    @Column(name = "risk_score", nullable = false)
    @Builder.Default
    private Double riskScore = 0.0;

    @Column(name = "trust_level", nullable = false)
    @Builder.Default
    private Integer trustLevel = 100;

    @Column(name = "max_actions_per_minute")
    @Builder.Default
    private Integer maxActionsPerMinute = 60;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allowed_ip_ranges", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> allowedIpRanges = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "behavioral_baseline", columnDefinition = "jsonb")
    private Map<String, Object> behavioralBaseline;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AgentPolicy> policies = new ArrayList<>();

    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AgentSession> sessions = new ArrayList<>();

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private Instant updatedAt;

    public boolean isActive() {
        return status == AgentStatus.ACTIVE;
    }
}
