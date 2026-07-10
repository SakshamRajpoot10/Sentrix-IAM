package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response returned ONCE when an agent is created.
 * Contains the plaintext API key — shown only at creation time.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentCreatedResponse {
    private String id;
    private String name;
    private String type;
    private String status;
    private String apiKey;       // ⚠️ Shown ONCE, then NEVER again
    private String apiKeyPrefix;
    private Instant createdAt;
    private String warning;      // "Save this API key now. You won't be able to see it again."
}
