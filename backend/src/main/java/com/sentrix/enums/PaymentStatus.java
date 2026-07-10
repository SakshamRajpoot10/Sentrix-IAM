package com.sentrix.enums;

/**
 * Payment processing status.
 */
public enum PaymentStatus {
    PENDING,    // Payment initiated
    AUTHORIZED, // Payment authorized but not captured
    CAPTURED,   // Payment successfully captured
    FAILED,     // Payment failed
    REFUNDED    // Payment refunded
}
