package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubscriptionResponse {
    private String id;
    private String razorpaySubscriptionId;
    private String plan;
    private String status;
    private Integer agentLimit;
    private Integer policyLimit;
    private Integer apiCallLimit;
    private Integer auditRetentionDays;
    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    private Instant createdAt;
}
