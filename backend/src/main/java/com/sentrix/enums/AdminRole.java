package com.sentrix.enums;

/**
 * Admin user roles with hierarchical permissions.
 * SUPER_ADMIN > ADMIN > AGENT_MANAGER > VIEWER
 */
public enum AdminRole {
    SUPER_ADMIN,    // Full access: org settings, billing, user management
    ADMIN,          // Manage agents, policies, resources, view audit
    AGENT_MANAGER,  // Manage agents and their policies only
    VIEWER          // Read-only access to dashboards and audit
}
