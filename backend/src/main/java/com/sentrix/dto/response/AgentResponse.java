package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentResponse {
    private String id;
    private String name;
    private String description;
    private String type;
    private String status;
    private String apiKeyPrefix;
    private Double riskScore;
    private Integer trustLevel;
    private Integer maxActionsPerMinute;
    private List<String> allowedIpRanges;
    private Map<String, Object> metadata;
    private Integer activePolicies;
    private Integer activeSessions;
    private Instant lastActiveAt;
    private Instant createdAt;
    private Instant updatedAt;
}
