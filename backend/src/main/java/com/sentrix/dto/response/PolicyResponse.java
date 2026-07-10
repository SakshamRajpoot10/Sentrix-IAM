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
public class PolicyResponse {
    private String id;
    private String name;
    private String description;
    private String effect;
    private String enforcement;
    private Integer priority;
    private List<Map<String, Object>> rules;
    private Map<String, Object> conditions;
    private Boolean isSystem;
    private Integer version;
    private Integer assignedAgents;
    private Instant createdAt;
    private Instant updatedAt;
}
