package com.sentrix.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request from SDK to authorize an agent action.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizeRequest {

    @NotBlank(message = "Action is required")
    private String action;

    @NotBlank(message = "Resource is required")
    private String resource;

    private Map<String, Object> context;

    private List<String> scopes;
}
