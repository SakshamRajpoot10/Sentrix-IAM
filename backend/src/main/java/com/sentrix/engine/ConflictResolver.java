package com.sentrix.engine;

import com.sentrix.entity.Policy;
import com.sentrix.enums.PolicyEffect;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Resolves conflicts when multiple policies match.
 *
 * Algorithm (deny-override):
 *   1. Any DENY match → DENIED
 *   2. Any CHALLENGE match (no DENY) → CHALLENGED
 *   3. Only ALLOW matches → ALLOWED
 *   4. No matches → DEFAULT DENY
 */
@Component
@Slf4j
public class ConflictResolver {

    public record PolicyMatch(Policy policy, PolicyEffect effect) {}

    /**
     * Resolve a list of matching policies into a single decision.
     */
    public PolicyEngineResult resolve(List<PolicyMatch> matches) {
        if (matches == null || matches.isEmpty()) {
            return PolicyEngineResult.defaultDeny("No matching policies found");
        }

        // Check for DENY (highest precedence)
        PolicyMatch denyMatch = matches.stream()
                .filter(m -> m.effect() == PolicyEffect.DENY)
                .findFirst()
                .orElse(null);

        if (denyMatch != null) {
            return PolicyEngineResult.denied(
                    "Denied by policy: " + denyMatch.policy().getName(),
                    denyMatch.policy().getId().toString(),
                    denyMatch.policy().getName()
            );
        }

        // Check for CHALLENGE
        PolicyMatch challengeMatch = matches.stream()
                .filter(m -> m.effect() == PolicyEffect.CHALLENGE)
                .findFirst()
                .orElse(null);

        if (challengeMatch != null) {
            return PolicyEngineResult.challenged(
                    "Challenged by policy: " + challengeMatch.policy().getName(),
                    challengeMatch.policy().getId().toString(),
                    challengeMatch.policy().getName()
            );
        }

        // Only ALLOW matches remain
        PolicyMatch allowMatch = matches.get(0); // Highest priority
        return PolicyEngineResult.allowed(
                "Allowed by policy: " + allowMatch.policy().getName(),
                allowMatch.policy().getId().toString(),
                allowMatch.policy().getName()
        );
    }
}
