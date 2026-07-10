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
public class DashboardResponse {
    private long totalAgents;
    private long activeAgents;
    private long suspendedAgents;
    private long totalPolicies;
    private long enforcingPolicies;
    private long totalResources;
    private long totalAuditLogs;
    private long recentAuditLogs;      // last 24h
    private long allowedActions24h;
    private long deniedActions24h;
    private double avgRiskScore;
    private long apiCallsToday;
    private long apiCallLimit;
    private String plan;
    private Instant lastEventAt;
}
