package com.sentrix.service;

import com.sentrix.dto.response.AuditLogResponse;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.entity.AuditLog;
import com.sentrix.entity.Organization;
import com.sentrix.enums.AuditDecision;
import com.sentrix.repository.AuditLogRepository;
import com.sentrix.repository.OrganizationRepository;
import com.sentrix.util.HashChainUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final OrganizationRepository organizationRepository;

    // ─── Create Audit Entry ────────────────────────────────────

    @Transactional
    public AuditLog createEntry(
            UUID orgId,
            UUID agentId,
            UUID sessionId,
            String action,
            String resource,
            AuditDecision decision,
            Double riskScore,
            UUID policyId,
            String reason,
            String ipAddress,
            String userAgent,
            Map<String, Object> requestContext
    ) {
        // Get previous hash for chain
        String previousHash = auditLogRepository.findLatestByOrganizationId(orgId)
                .map(AuditLog::getHash)
                .orElse(HashChainUtil.GENESIS_HASH);

        Instant now = Instant.now();
        String hash = HashChainUtil.computeHash(agentId, action, resource, decision.name(), now, previousHash);

        Organization org = organizationRepository.getReferenceById(orgId);

        AuditLog entry = AuditLog.builder()
                .organization(org)
                .agentId(agentId)
                .sessionId(sessionId)
                .action(action)
                .resource(resource)
                .decision(decision)
                .riskScore(riskScore)
                .policyId(policyId)
                .reason(reason)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .requestContext(requestContext)
                .hash(hash)
                .previousHash(previousHash)
                .build();

        entry = auditLogRepository.save(entry);
        log.debug("Audit entry created: {} → {} on {} = {} (hash: {}...)",
                agentId, action, resource, decision, hash.substring(0, 8));

        return entry;
    }

    // ─── List Audit Logs ───────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> listAuditLogs(UUID orgId, UUID agentId, Pageable pageable) {
        Page<AuditLog> page;
        if (agentId != null) {
            page = auditLogRepository.findByOrganizationIdAndAgentIdOrderByCreatedAtDesc(orgId, agentId, pageable);
        } else {
            page = auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId, pageable);
        }

        var items = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<AuditLogResponse>builder()
                .content(items)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    // ─── Verify Hash Chain ─────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> verifyChain(UUID orgId) {
        List<AuditLog> logs = auditLogRepository.findAllByOrganizationIdOrderByCreatedAtAsc(orgId);

        if (logs.isEmpty()) {
            return Map.of("verified", true, "totalEntries", 0, "message", "No audit logs to verify");
        }

        int valid = 0;
        int invalid = 0;
        String firstInvalidId = null;

        for (AuditLog entry : logs) {
            boolean isValid = HashChainUtil.verifyHash(
                    entry.getHash(),
                    entry.getAgentId(),
                    entry.getAction(),
                    entry.getResource(),
                    entry.getDecision().name(),
                    entry.getCreatedAt(),
                    entry.getPreviousHash()
            );

            if (isValid) {
                valid++;
            } else {
                invalid++;
                if (firstInvalidId == null) {
                    firstInvalidId = entry.getId().toString();
                }
            }
        }

        boolean allValid = invalid == 0;
        return Map.of(
                "verified", allValid,
                "totalEntries", logs.size(),
                "validEntries", valid,
                "invalidEntries", invalid,
                "firstInvalidEntryId", firstInvalidId != null ? firstInvalidId : "",
                "message", allValid ? "✅ Hash chain integrity verified" : "⚠️ Hash chain integrity compromised"
        );
    }

    // ─── Helpers ───────────────────────────────────────────────

    private AuditLogResponse toResponse(AuditLog entry) {
        return AuditLogResponse.builder()
                .id(entry.getId().toString())
                .agentId(entry.getAgentId() != null ? entry.getAgentId().toString() : null)
                .sessionId(entry.getSessionId() != null ? entry.getSessionId().toString() : null)
                .action(entry.getAction())
                .resource(entry.getResource())
                .decision(entry.getDecision().name())
                .riskScore(entry.getRiskScore())
                .policyId(entry.getPolicyId() != null ? entry.getPolicyId().toString() : null)
                .reason(entry.getReason())
                .ipAddress(entry.getIpAddress())
                .requestContext(entry.getRequestContext())
                .hash(entry.getHash())
                .previousHash(entry.getPreviousHash())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    @Transactional
    public int cleanOldLogs(UUID orgId, Instant cutoff) {
        auditLogRepository.enableAuditRetentionDelete();
        int deleted = auditLogRepository.deleteLogsOlderThan(orgId, cutoff);
        log.info("Deleted {} expired audit logs for organization {}", deleted, orgId);
        return deleted;
    }
}
