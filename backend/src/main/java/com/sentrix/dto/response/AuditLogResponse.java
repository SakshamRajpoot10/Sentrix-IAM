package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditLogResponse {
    private String id;
    private String agentId;
    private String agentName;
    private String sessionId;
    private String action;
    private String resource;
    private String decision;
    private Double riskScore;
    private String policyId;
    private String reason;
    private String ipAddress;
    private Map<String, Object> requestContext;
    private String hash;
    private String previousHash;
    private Instant createdAt;
}
