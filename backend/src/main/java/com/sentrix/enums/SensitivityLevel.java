package com.sentrix.enums;

/**
 * Data sensitivity classification (5 levels).
 */
public enum SensitivityLevel {
    PUBLIC,         // Publicly accessible data
    INTERNAL,       // Internal use only
    CONFIDENTIAL,   // Restricted access required
    SENSITIVE,      // Highly restricted — PII, financial data
    CRITICAL        // Highest sensitivity — encryption keys, admin credentials
}
