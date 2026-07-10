package com.sentrix.scheduler;

import com.sentrix.entity.Organization;
import com.sentrix.entity.UsageRecord;
import com.sentrix.enums.AgentStatus;
import com.sentrix.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/**
 * Scheduled job to aggregate usage metrics daily.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class UsageAggregationJob {

    private final OrganizationRepository organizationRepository;
    private final UsageRecordRepository usageRecordRepository;
    private final AgentRepository agentRepository;
    private final PolicyRepository policyRepository;
    private final AuditLogRepository auditLogRepository;

    @Scheduled(cron = "0 0 0 * * *") // Midnight daily
    @Transactional
    public void aggregateUsage() {
        log.info("Daily usage aggregation job started");
        try {
            List<Organization> organizations = organizationRepository.findAll();
            LocalDate yesterday = LocalDate.now().minusDays(1);
            Instant startOfDay = yesterday.atStartOfDay().toInstant(ZoneOffset.UTC);
            Instant endOfDay = yesterday.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

            for (Organization org : organizations) {
                try {
                    // Count API calls in audit logs for yesterday
                    long apiCalls = auditLogRepository.countByOrganizationIdAndCreatedAtAfter(org.getId(), startOfDay)
                            - auditLogRepository.countByOrganizationIdAndCreatedAtAfter(org.getId(), endOfDay);
                    if (apiCalls < 0) apiCalls = 0;

                    // Count active agents
                    int activeAgents = (int) agentRepository.countByOrganizationIdAndStatus(org.getId(), AgentStatus.ACTIVE);

                    // Count policies
                    int policiesCount = (int) policyRepository.countByOrganizationId(org.getId());

                    // Count anomalies
                    int anomalies = (int) auditLogRepository.countAnomalies(org.getId(), startOfDay, endOfDay);

                    UsageRecord record = usageRecordRepository.findByOrganizationIdAndRecordDate(org.getId(), yesterday)
                            .orElse(UsageRecord.builder()
                                    .organizationId(org.getId())
                                    .recordDate(yesterday)
                                    .build());

                    record.setApiCalls(apiCalls);
                    record.setAgentsActive(activeAgents);
                    record.setPoliciesCount(policiesCount);
                    record.setAnomaliesDetected(anomalies);

                    usageRecordRepository.save(record);
                    log.info("Aggregated usage for organization '{}': calls={}, agents={}, policies={}, anomalies={}",
                            org.getName(), apiCalls, activeAgents, policiesCount, anomalies);
                } catch (Exception e) {
                    log.error("Failed to aggregate usage for organization {}: {}", org.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error in usage aggregation job: {}", e.getMessage());
        }
        log.info("Daily usage aggregation job completed");
    }
}
