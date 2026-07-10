package com.sentrix.engine;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Glob pattern matcher for resource identifiers.
 * Supports:
 *   - * matches any single segment
 *   - ** matches any number of segments
 *   - Exact match for literal segments
 *
 * Examples:
 *   "database:prod:*" matches "database:prod:users" but NOT "database:staging:users"
 *   "database:**" matches "database:prod:users:table1"
 *   "api:v1:*:read" matches "api:v1:users:read"
 */
@Component
@Slf4j
public class GlobMatcher {

    private static final String SEPARATOR = ":";

    /**
     * Check if a resource identifier matches a glob pattern.
     *
     * @param pattern  the glob pattern (e.g., "database:prod:*")
     * @param resource the actual resource (e.g., "database:prod:users")
     * @return true if pattern matches resource
     */
    public boolean matches(String pattern, String resource) {
        if (pattern == null || resource == null) return false;

        // Wildcard matches everything
        if ("*".equals(pattern) || "**".equals(pattern)) return true;

        // Exact match
        if (pattern.equals(resource)) return true;

        String[] patternParts = pattern.split(SEPARATOR);
        String[] resourceParts = resource.split(SEPARATOR);

        return matchParts(patternParts, 0, resourceParts, 0);
    }

    private boolean matchParts(String[] pattern, int pi, String[] resource, int ri) {
        // Both exhausted → match
        if (pi == pattern.length && ri == resource.length) return true;

        // Pattern exhausted but resource remaining → no match
        if (pi == pattern.length) return false;

        // Double star: matches zero or more segments
        if ("**".equals(pattern[pi])) {
            // Try matching zero segments (skip **)
            if (matchParts(pattern, pi + 1, resource, ri)) return true;

            // Try matching one or more segments
            for (int i = ri; i < resource.length; i++) {
                if (matchParts(pattern, pi + 1, resource, i + 1)) return true;
            }
            return false;
        }

        // Resource exhausted but pattern remaining → no match (unless remaining is **)
        if (ri == resource.length) return false;

        // Single star: matches any single segment
        if ("*".equals(pattern[pi])) {
            return matchParts(pattern, pi + 1, resource, ri + 1);
        }

        // Exact segment match
        if (pattern[pi].equals(resource[ri])) {
            return matchParts(pattern, pi + 1, resource, ri + 1);
        }

        return false;
    }
}
