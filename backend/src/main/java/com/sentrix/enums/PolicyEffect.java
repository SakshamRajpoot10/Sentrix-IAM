package com.sentrix.enums;

/**
 * Policy rule effect — what happens when a rule matches.
 */
public enum PolicyEffect {
    ALLOW,      // Permit the action
    DENY,       // Block the action
    CHALLENGE   // Require additional verification / human approval
}
