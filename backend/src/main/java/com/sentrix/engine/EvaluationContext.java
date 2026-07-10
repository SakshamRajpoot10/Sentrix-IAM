package com.sentrix.engine;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Context passed to the policy engine during evaluation.
 * Contains all runtime information needed for condition checks.
 */
@Data
@Builder
public class EvaluationContext {
    private double agentRiskScore;
    private int agentTrustLevel;
    private String ipAddress;
    private String userAgent;
    private List<String> scopes;

    public static EvaluationContext defaults() {
        return EvaluationContext.builder()
                .agentRiskScore(0.0)
                .agentTrustLevel(100)
                .scopes(List.of("*"))
                .build();
    }
}
