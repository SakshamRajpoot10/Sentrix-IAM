package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InvoiceResponse {
    private String id;
    private String invoiceNumber;
    private String status;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String plan;
    private Instant periodStart;
    private Instant periodEnd;
    private Instant paidAt;
    private Instant createdAt;
}
