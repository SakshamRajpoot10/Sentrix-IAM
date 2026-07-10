package com.sentrix.service;

import com.sentrix.dto.response.DashboardResponse;
import com.sentrix.entity.Organization;
import com.sentrix.enums.AgentStatus;
import com.sentrix.enums.AuditDecision;
import com.sentrix.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AnalyticsService {

    private final AgentRepository agentRepository;
    private final PolicyRepository policyRepository;
    private final AuditLogRepository auditLogRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID orgId) {
        Organization org = organizationRepository.findById(orgId).orElse(null);

        Instant now = Instant.now();
        Instant last24h = now.minus(24, ChronoUnit.HOURS);

        long totalAgents = agentRepository.countByOrganizationIdAndStatus(orgId, AgentStatus.ACTIVE)
                + agentRepository.countByOrganizationIdAndStatus(orgId, AgentStatus.SUSPENDED);
        long activeAgents = agentRepository.countByOrganizationIdAndStatus(orgId, AgentStatus.ACTIVE);
        long suspendedAgents = agentRepository.countByOrganizationIdAndStatus(orgId, AgentStatus.SUSPENDED);
        long totalPolicies = policyRepository.countByOrganizationId(orgId);
        long totalAuditLogs = auditLogRepository.countByOrganizationIdAndCreatedAtAfter(orgId, Instant.EPOCH);
        long recentAuditLogs = auditLogRepository.countByOrganizationIdAndCreatedAtAfter(orgId, last24h);
        long allowedActions24h = auditLogRepository.countByOrganizationIdAndDecision(orgId, AuditDecision.ALLOWED);
        long deniedActions24h = auditLogRepository.countByOrganizationIdAndDecision(orgId, AuditDecision.DENIED);

        return DashboardResponse.builder()
                .totalAgents(totalAgents)
                .activeAgents(activeAgents)
                .suspendedAgents(suspendedAgents)
                .totalPolicies(totalPolicies)
                .totalAuditLogs(totalAuditLogs)
                .recentAuditLogs(recentAuditLogs)
                .allowedActions24h(allowedActions24h)
                .deniedActions24h(deniedActions24h)
                .plan(org != null ? org.getPlan().name() : "FREE")
                .apiCallLimit(org != null ? org.getApiCallLimit() : 10000)
                .build();
    }
}
