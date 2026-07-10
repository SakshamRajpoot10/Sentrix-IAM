package com.sentrix.scheduler;

import com.sentrix.entity.Organization;
import com.sentrix.repository.OrganizationRepository;
import com.sentrix.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job to delete old audit logs based on plan retention limits.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditRetentionJob {

    private final OrganizationRepository organizationRepository;
    private final AuditService auditService;

    @Scheduled(cron = "0 0 2 * * *") // 2 AM daily
    public void cleanupOldAuditLogs() {
        log.info("Audit retention cleanup started");
        try {
            List<Organization> organizations = organizationRepository.findAll();
            for (Organization org : organizations) {
                try {
                    int retentionDays = org.getAuditRetentionDays();
                    Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
                    int deleted = auditService.cleanOldLogs(org.getId(), cutoff);
                    log.info("Cleaned up {} old audit logs for organization: {}", deleted, org.getName());
                } catch (Exception e) {
                    log.error("Failed to clean audit logs for organization {}: {}", org.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error in audit retention cleanup: {}", e.getMessage());
        }
        log.info("Audit retention cleanup completed");
    }
}
