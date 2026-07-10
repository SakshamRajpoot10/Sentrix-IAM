package com.sentrix.engine;

import com.sentrix.enums.AuditDecision;
import lombok.Builder;
import lombok.Data;

/**
 * Immutable result from policy engine evaluation.
 */
@Data
@Builder
public class PolicyEngineResult {

    private final AuditDecision decision;
    private final String reason;
    private final String matchedPolicyId;
    private final String matchedPolicyName;
    private final double riskScore;

    public boolean isAllowed() {
        return decision == AuditDecision.ALLOWED;
    }

    public static PolicyEngineResult allowed(String reason, String policyId, String policyName) {
        return PolicyEngineResult.builder()
                .decision(AuditDecision.ALLOWED)
                .reason(reason)
                .matchedPolicyId(policyId)
                .matchedPolicyName(policyName)
                .build();
    }

    public static PolicyEngineResult denied(String reason, String policyId, String policyName) {
        return PolicyEngineResult.builder()
                .decision(AuditDecision.DENIED)
                .reason(reason)
                .matchedPolicyId(policyId)
                .matchedPolicyName(policyName)
                .build();
    }

    public static PolicyEngineResult challenged(String reason, String policyId, String policyName) {
        return PolicyEngineResult.builder()
                .decision(AuditDecision.CHALLENGED)
                .reason(reason)
                .matchedPolicyId(policyId)
                .matchedPolicyName(policyName)
                .build();
    }

    public static PolicyEngineResult defaultDeny(String reason) {
        return PolicyEngineResult.builder()
                .decision(AuditDecision.DENIED)
                .reason(reason)
                .build();
    }

    public static PolicyEngineResult error(String reason) {
        return PolicyEngineResult.builder()
                .decision(AuditDecision.ERROR)
                .reason(reason)
                .build();
    }
}
