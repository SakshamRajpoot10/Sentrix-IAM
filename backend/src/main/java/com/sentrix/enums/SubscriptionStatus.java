package com.sentrix.enums;

/**
 * Razorpay subscription lifecycle status.
 */
public enum SubscriptionStatus {
    CREATED,      // Subscription created, awaiting payment
    AUTHENTICATED,// Payment method authenticated
    ACTIVE,       // Subscription is active and billing
    PAST_DUE,     // Payment failed — grace period
    HALTED,       // Subscription halted after failed retries
    CANCELLED,    // Subscription cancelled by user
    COMPLETED,    // Subscription term completed
    EXPIRED,      // Subscription expired
    TRIALING      // In trial period
}
