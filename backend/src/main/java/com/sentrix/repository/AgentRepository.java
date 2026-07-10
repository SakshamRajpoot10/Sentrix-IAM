package com.sentrix.repository;

import com.sentrix.entity.Agent;
import com.sentrix.enums.AgentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentRepository extends JpaRepository<Agent, UUID> {

    Page<Agent> findByOrganizationId(UUID organizationId, Pageable pageable);

    Optional<Agent> findByApiKeyPrefix(String apiKeyPrefix);

    long countByOrganizationIdAndStatus(UUID organizationId, AgentStatus status);

    @Query("SELECT a FROM Agent a LEFT JOIN FETCH a.policies ap LEFT JOIN FETCH ap.policy WHERE a.id = :id")
    Optional<Agent> findByIdWithPolicies(UUID id);

    @Query("SELECT a FROM Agent a WHERE a.apiKeyPrefix = :prefix AND a.status = 'ACTIVE'")
    Optional<Agent> findActiveByApiKeyPrefix(String prefix);
}
