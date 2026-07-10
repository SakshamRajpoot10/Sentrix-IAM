package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from the policy engine authorization decision.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthorizeResponse {
    private boolean allowed;
    private String decision;    // ALLOWED, DENIED, CHALLENGED, ERROR
    private Double riskScore;
    private String reason;
    private String policyId;
    private String policyName;
}
