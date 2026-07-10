package com.sentrix.dto.request;

import com.sentrix.enums.SensitivityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResourceRequest {

    @NotBlank(message = "Resource name is required")
    @Size(min = 2, max = 100, message = "Resource name must be 2-100 characters")
    private String name;

    @NotBlank(message = "Resource type is required")
    private String resourceType;

    @NotBlank(message = "Resource identifier is required")
    private String identifier;

    private SensitivityLevel sensitivity;

    @Size(max = 500, message = "Description must be under 500 characters")
    private String description;

    private Map<String, Object> metadata;
}
