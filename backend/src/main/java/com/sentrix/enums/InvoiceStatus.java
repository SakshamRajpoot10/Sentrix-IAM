package com.sentrix.enums;

/**
 * Invoice lifecycle status.
 */
public enum InvoiceStatus {
    DRAFT,    // Invoice created but not finalized
    ISSUED,   // Invoice sent to customer
    PAID,     // Invoice paid
    OVERDUE,  // Invoice past due date
    VOID      // Invoice voided / cancelled
}
