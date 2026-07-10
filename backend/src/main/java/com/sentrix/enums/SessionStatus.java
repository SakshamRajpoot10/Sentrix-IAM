package com.sentrix.enums;

/**
 * Agent session lifecycle status.
 */
public enum SessionStatus {
    ACTIVE,    // Session is valid and in use
    EXPIRED,   // Session time-to-live has passed
    REVOKED    // Session manually or automatically revoked
}
