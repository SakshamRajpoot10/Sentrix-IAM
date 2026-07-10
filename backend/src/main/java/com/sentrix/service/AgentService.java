package com.sentrix.service;

import com.sentrix.dto.request.CreateAgentRequest;
import com.sentrix.dto.request.UpdateAgentRequest;
import com.sentrix.dto.response.AgentCreatedResponse;
import com.sentrix.dto.response.AgentResponse;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.entity.Agent;
import com.sentrix.entity.Organization;
import com.sentrix.enums.AgentStatus;
import com.sentrix.enums.AgentType;
import com.sentrix.exception.PlanLimitExceededException;
import com.sentrix.exception.ResourceNotFoundException;
import com.sentrix.repository.AgentRepository;
import com.sentrix.repository.AgentSessionRepository;
import com.sentrix.repository.OrganizationRepository;
import com.sentrix.util.ApiKeyGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository agentRepository;
    private final OrganizationRepository organizationRepository;
    private final AgentSessionRepository agentSessionRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Create Agent ──────────────────────────────────────────

    @Transactional
    public AgentCreatedResponse createAgent(UUID orgId, CreateAgentRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId.toString()));

        // Check plan limits
        long activeCount = agentRepository.countByOrganizationIdAndStatus(orgId, AgentStatus.ACTIVE);
        if (activeCount >= org.getAgentLimit()) {
            throw new PlanLimitExceededException("Agent limit exceeded for organization", "agent", org.getAgentLimit());
        }

        // Generate API key
        String apiKey = ApiKeyGenerator.generate();
        String prefix = ApiKeyGenerator.extractPrefix(apiKey);
        String hash = passwordEncoder.encode(apiKey);

        Agent agent = Agent.builder()
                .organization(org)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : AgentType.AUTONOMOUS)
                .status(AgentStatus.ACTIVE)
                .apiKeyHash(hash)
                .apiKeyPrefix(prefix)
                .maxActionsPerMinute(request.getMaxActionsPerMinute() != null ? request.getMaxActionsPerMinute() : 60)
                .allowedIpRanges(request.getAllowedIpRanges())
                .metadata(request.getMetadata())
                .build();

        agent = agentRepository.save(agent);
        log.info("Agent created: {} (id: {}, org: {})", agent.getName(), agent.getId(), org.getName());

        return AgentCreatedResponse.builder()
                .id(agent.getId().toString())
                .name(agent.getName())
                .type(agent.getType().name())
                .status(agent.getStatus().name())
                .apiKey(apiKey)
                .apiKeyPrefix(prefix)
                .createdAt(agent.getCreatedAt())
                .warning("⚠️ Save this API key now. You won't be able to see it again.")
                .build();
    }

    // ─── List Agents ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<AgentResponse> listAgents(UUID orgId, Pageable pageable) {
        Page<Agent> page = agentRepository.findByOrganizationId(orgId, pageable);

        var items = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<AgentResponse>builder()
                .content(items)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    // ─── Get Agent ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AgentResponse getAgent(UUID orgId, UUID agentId) {
        Agent agent = findAgentByOrgAndId(orgId, agentId);
        return toResponse(agent);
    }

    // ─── Update Agent ──────────────────────────────────────────

    @Transactional
    public AgentResponse updateAgent(UUID orgId, UUID agentId, UpdateAgentRequest request) {
        Agent agent = findAgentByOrgAndId(orgId, agentId);

        if (request.getName() != null) agent.setName(request.getName());
        if (request.getDescription() != null) agent.setDescription(request.getDescription());
        if (request.getType() != null) agent.setType(request.getType());
        if (request.getStatus() != null) agent.setStatus(request.getStatus());
        if (request.getMaxActionsPerMinute() != null) agent.setMaxActionsPerMinute(request.getMaxActionsPerMinute());
        if (request.getAllowedIpRanges() != null) agent.setAllowedIpRanges(request.getAllowedIpRanges());
        if (request.getMetadata() != null) agent.setMetadata(request.getMetadata());

        agent = agentRepository.save(agent);
        log.info("Agent updated: {} (id: {})", agent.getName(), agent.getId());

        return toResponse(agent);
    }

    // ─── Delete Agent ──────────────────────────────────────────

    @Transactional
    public void deleteAgent(UUID orgId, UUID agentId) {
        Agent agent = findAgentByOrgAndId(orgId, agentId);
        agent.setStatus(AgentStatus.DECOMMISSIONED);
        agentRepository.save(agent);
        log.info("Agent decommissioned: {} (id: {})", agent.getName(), agent.getId());
    }

    // ─── Suspend / Activate ────────────────────────────────────

    @Transactional
    public AgentResponse suspendAgent(UUID orgId, UUID agentId) {
        Agent agent = findAgentByOrgAndId(orgId, agentId);
        agent.setStatus(AgentStatus.SUSPENDED);
        // Revoke all active sessions
        agentSessionRepository.revokeAllActiveSessions(agentId);
        agent = agentRepository.save(agent);
        log.warn("Agent suspended: {} (id: {})", agent.getName(), agent.getId());
        return toResponse(agent);
    }

    @Transactional
    public AgentResponse activateAgent(UUID orgId, UUID agentId) {
        Agent agent = findAgentByOrgAndId(orgId, agentId);
        agent.setStatus(AgentStatus.ACTIVE);
        agent.setRiskScore(0.0);
        agent = agentRepository.save(agent);
        log.info("Agent activated: {} (id: {})", agent.getName(), agent.getId());
        return toResponse(agent);
    }

    // ─── Regenerate API Key ────────────────────────────────────

    @Transactional
    public AgentCreatedResponse regenerateApiKey(UUID orgId, UUID agentId) {
        Agent agent = findAgentByOrgAndId(orgId, agentId);

        String newApiKey = ApiKeyGenerator.generate();
        String prefix = ApiKeyGenerator.extractPrefix(newApiKey);
        String hash = passwordEncoder.encode(newApiKey);

        agent.setApiKeyHash(hash);
        agent.setApiKeyPrefix(prefix);
        // Revoke all existing sessions
        agentSessionRepository.revokeAllActiveSessions(agentId);
        agent = agentRepository.save(agent);

        log.info("API key regenerated for agent: {} (id: {})", agent.getName(), agent.getId());

        return AgentCreatedResponse.builder()
                .id(agent.getId().toString())
                .name(agent.getName())
                .type(agent.getType().name())
                .status(agent.getStatus().name())
                .apiKey(newApiKey)
                .apiKeyPrefix(prefix)
                .createdAt(agent.getCreatedAt())
                .warning("⚠️ Save this API key now. You won't be able to see it again.")
                .build();
    }

    // ─── Internal helpers ──────────────────────────────────────

    private Agent findAgentByOrgAndId(UUID orgId, UUID agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", agentId.toString()));
        if (!agent.getOrganization().getId().equals(orgId)) {
            throw new ResourceNotFoundException("Agent", agentId.toString());
        }
        return agent;
    }

    private AgentResponse toResponse(Agent agent) {
        return AgentResponse.builder()
                .id(agent.getId().toString())
                .name(agent.getName())
                .description(agent.getDescription())
                .type(agent.getType().name())
                .status(agent.getStatus().name())
                .apiKeyPrefix(agent.getApiKeyPrefix())
                .riskScore(agent.getRiskScore())
                .trustLevel(agent.getTrustLevel())
                .maxActionsPerMinute(agent.getMaxActionsPerMinute())
                .allowedIpRanges(agent.getAllowedIpRanges())
                .metadata(agent.getMetadata())
                .activePolicies(agent.getPolicies() != null ? agent.getPolicies().size() : 0)
                .activeSessions(agent.getSessions() != null ?
                        (int) agent.getSessions().stream().filter(s -> s.isValid()).count() : 0)
                .lastActiveAt(agent.getLastActiveAt())
                .createdAt(agent.getCreatedAt())
                .updatedAt(agent.getUpdatedAt())
                .build();
    }
}
