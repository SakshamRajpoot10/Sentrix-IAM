package com.sentrix.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "usage_records", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"organization_id", "record_date"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class UsageRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "api_calls", nullable = false)
    @Builder.Default
    private Long apiCalls = 0L;

    @Column(name = "agents_active", nullable = false)
    @Builder.Default
    private Integer agentsActive = 0;

    @Column(name = "policies_count", nullable = false)
    @Builder.Default
    private Integer policiesCount = 0;

    @Column(name = "anomalies_detected", nullable = false)
    @Builder.Default
    private Integer anomaliesDetected = 0;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private Instant createdAt;
}
