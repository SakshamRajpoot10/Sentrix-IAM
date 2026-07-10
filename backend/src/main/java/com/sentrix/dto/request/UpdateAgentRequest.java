package com.sentrix.dto.request;

import com.sentrix.enums.AgentStatus;
import com.sentrix.enums.AgentType;
import jakarta.validation.constraints.Size;
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
public class UpdateAgentRequest {

    @Size(min = 2, max = 100, message = "Agent name must be 2-100 characters")
    private String name;

    @Size(max = 500, message = "Description must be under 500 characters")
    private String description;

    private AgentType type;

    private AgentStatus status;

    private Integer maxActionsPerMinute;

    private List<String> allowedIpRanges;

    private Map<String, Object> metadata;
}
