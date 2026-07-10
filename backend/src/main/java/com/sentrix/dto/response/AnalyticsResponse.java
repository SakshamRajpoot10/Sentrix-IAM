package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnalyticsResponse {
    private long totalAgents;
    private long activeAgents;
    private long totalPolicies;
    private long totalAuditLogs;
    private long allowedActions;
    private long deniedActions;
    private long challengedActions;
    private double avgRiskScore;
    private List<Map<String, Object>> activityTimeline;
    private List<Map<String, Object>> topAgents;
    private List<Map<String, Object>> topActions;
    private List<Map<String, Object>> riskDistribution;
}
