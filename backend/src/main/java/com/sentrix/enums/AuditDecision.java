package com.sentrix.enums;

/**
 * Audit log decision outcome.
 */
public enum AuditDecision {
    ALLOWED,     // Action was permitted
    DENIED,      // Action was blocked by policy
    CHALLENGED,  // Action requires additional verification
    ERROR        // Policy evaluation failed
}
