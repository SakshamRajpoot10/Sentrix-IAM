package com.sentrix.enums;

/**
 * Lifecycle status of an AI agent.
 */
public enum AgentStatus {
    ACTIVE,           // Agent is operational
    SUSPENDED,        // Temporarily suspended (manual or auto-revoke)
    REVOKED,          // Permanently revoked — cannot be reactivated
    DECOMMISSIONED    // Gracefully retired
}
