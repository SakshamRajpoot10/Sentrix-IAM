package com.sentrix.engine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Evaluates a single policy rule against an action and resource.
 *
 * A rule is a JSON map with:
 *   - actions: ["READ", "WRITE", "*"]
 *   - resources: ["database:prod:*", "api:**"]
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RuleEvaluator {

    private final GlobMatcher globMatcher;

    /**
     * Check if a rule matches the given action and resource.
     *
     * @param rule     the rule map from the policy JSON
     * @param action   the action being performed (e.g., "WRITE")
     * @param resource the resource being accessed (e.g., "database:prod:users")
     * @return true if the rule matches both action and resource
     */
    public boolean matches(Map<String, Object> rule, String action, String resource) {
        if (rule == null) return false;

        // Check actions
        Object actionsObj = rule.get("actions");
        if (actionsObj instanceof List<?> actions) {
            boolean actionMatches = actions.stream()
                    .map(Object::toString)
                    .anyMatch(a -> "*".equals(a) || a.equalsIgnoreCase(action));
            if (!actionMatches) return false;
        } else {
            return false; // Rule must have actions
        }

        // Check resources
        Object resourcesObj = rule.get("resources");
        if (resourcesObj instanceof List<?> resources) {
            boolean resourceMatches = resources.stream()
                    .map(Object::toString)
                    .anyMatch(pattern -> globMatcher.matches(pattern, resource));
            if (!resourceMatches) return false;
        } else {
            return false; // Rule must have resources
        }

        return true;
    }
}
