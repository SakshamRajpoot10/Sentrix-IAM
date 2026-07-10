package com.sentrix.engine;

import com.sentrix.entity.Agent;
import com.sentrix.entity.AgentPolicy;
import com.sentrix.entity.Policy;
import com.sentrix.enums.PolicyEnforcement;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Core Policy Engine — evaluates whether an agent action should be allowed.
 *
 * Algorithm:
 *   1. Gather all ENFORCING policies assigned to the agent
 *   2. Sort by priority (lower = higher precedence)
 *   3. For each policy, check if any rule matches the action + resource
 *   4. Apply condition checks
 *   5. Resolve conflicts using deny-override model
 *   6. Return decision + metadata
 *
 * This is a PURE FUNCTION — no side effects during evaluation.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PolicyEngine {

    private final RuleEvaluator ruleEvaluator;
    private final ConditionMatcher conditionMatcher;
    private final ConflictResolver conflictResolver;

    /**
     * Evaluate whether an agent should be allowed to perform an action on a resource.
     *
     * @param agent    the agent attempting the action
     * @param action   the action being performed (e.g., "WRITE", "READ", "DELETE")
     * @param resource the resource being accessed (e.g., "database:prod:users")
     * @param context  runtime context (risk score, IP, scopes, etc.)
     * @return evaluation result with decision, reason, and matched policy
     */
    public PolicyEngineResult evaluate(
            Agent agent,
            String action,
            String resource,
            EvaluationContext context
    ) {
        log.debug("Evaluating: agent={}, action={}, resource={}", agent.getName(), action, resource);

        // 1. Gather enforcing policies, sorted by priority
        List<Policy> policies = agent.getPolicies().stream()
                .map(AgentPolicy::getPolicy)
                .filter(p -> p.getEnforcement() != PolicyEnforcement.DISABLED)
                .sorted(Comparator.comparingInt(p -> p.getPriority()))
                .toList();

        if (policies.isEmpty()) {
            log.debug("No policies assigned to agent {}", agent.getName());
            return PolicyEngineResult.defaultDeny("No policies assigned to agent");
        }

        // 2. Find all matching rules across policies
        List<ConflictResolver.PolicyMatch> matches = new ArrayList<>();

        for (Policy policy : policies) {
            boolean isPermissive = policy.getEnforcement() == PolicyEnforcement.PERMISSIVE;

            // Check conditions first
            if (!conditionMatcher.allConditionsMet(policy.getConditions(), context)) {
                log.debug("Policy '{}' conditions not met, skipping", policy.getName());
                continue;
            }

            // Check each rule in the policy
            List<Map<String, Object>> rules = policy.getRules();
            if (rules == null || rules.isEmpty()) continue;

            for (Map<String, Object> rule : rules) {
                if (ruleEvaluator.matches(rule, action, resource)) {
                    if (isPermissive) {
                        // Permissive mode: log match but don't enforce
                        log.info("PERMISSIVE policy '{}' matched: {} -> {} (would {})",
                                policy.getName(), action, resource, policy.getEffect());
                    } else {
                        matches.add(new ConflictResolver.PolicyMatch(policy, policy.getEffect()));
                    }
                }
            }
        }

        // 3. Resolve conflicts
        PolicyEngineResult result = conflictResolver.resolve(matches);
        log.debug("Evaluation result: {} (reason: {})", result.getDecision(), result.getReason());

        return result;
    }
}
