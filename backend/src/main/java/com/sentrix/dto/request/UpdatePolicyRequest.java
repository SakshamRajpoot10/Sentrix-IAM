package com.sentrix.dto.request;

import com.sentrix.enums.PolicyEffect;
import com.sentrix.enums.PolicyEnforcement;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class UpdatePolicyRequest {

    @Size(min = 2, max = 100, message = "Policy name must be 2-100 characters")
    private String name;

    @Size(max = 500, message = "Description must be under 500 characters")
    private String description;

    private PolicyEffect effect;

    private PolicyEnforcement enforcement;

    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 1000, message = "Priority must be at most 1000")
    private Integer priority;

    @Size(min = 1, message = "At least one rule is required")
    private List<Map<String, Object>> rules;

    private Map<String, Object> conditions;
}
