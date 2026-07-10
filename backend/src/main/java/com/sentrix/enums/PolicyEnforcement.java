package com.sentrix.enums;

/**
 * Policy enforcement mode.
 */
public enum PolicyEnforcement {
    ENFORCING,   // Policy actively enforced — decisions are binding
    PERMISSIVE,  // Policy evaluated but not enforced — audit only (shadow mode)
    DISABLED     // Policy skipped entirely during evaluation
}
