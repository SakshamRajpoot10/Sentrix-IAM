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
public class ResourceResponse {
    private String id;
    private String name;
    private String resourceType;
    private String identifier;
    private String sensitivity;
    private String description;
    private Map<String, Object> metadata;
    private Instant createdAt;
    private Instant updatedAt;
}
