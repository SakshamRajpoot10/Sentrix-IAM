package com.sentrix.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlanResponse {
    private String id;
    private String name;
    private String displayName;
    private Integer priceMonthly;     // in paise
    private String currency;
    private List<Map<String, Object>> features;
    private Integer agentLimit;
    private Integer policyLimit;
    private Integer apiCallLimit;
    private Integer auditRetentionDays;
    private Boolean recommended;
}
