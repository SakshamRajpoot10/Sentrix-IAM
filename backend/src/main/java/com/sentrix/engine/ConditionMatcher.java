package com.sentrix.engine;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

/**
 * Evaluates policy conditions such as time windows, IP ranges, risk thresholds, etc.
 *
 * Supported conditions:
 *   - timeWindow: {start: "09:00", end: "18:00", timezone: "Asia/Kolkata", daysOfWeek: [1-5]}
 *   - maxRiskScore: 0.5  (deny if agent risk > threshold)
 *   - ipAllowlist: ["192.168.1.0/24", "10.0.0.0/8"]
 *   - requiredScopes: ["read", "write"]
 */
@Component
@Slf4j
public class ConditionMatcher {

    /**
     * Check if ALL conditions in the map are satisfied.
     *
     * @param conditions  the conditions map from the policy
     * @param context     the evaluation context (risk score, IP, scopes, etc.)
     * @return true if all conditions pass
     */
    @SuppressWarnings("unchecked")
    public boolean allConditionsMet(Map<String, Object> conditions, EvaluationContext context) {
        if (conditions == null || conditions.isEmpty()) return true;

        for (Map.Entry<String, Object> entry : conditions.entrySet()) {
            String conditionType = entry.getKey();
            Object conditionValue = entry.getValue();

            boolean met = switch (conditionType) {
                case "timeWindow" -> checkTimeWindow((Map<String, Object>) conditionValue);
                case "maxRiskScore" -> checkMaxRiskScore(conditionValue, context);
                case "ipAllowlist" -> checkIpAllowlist((List<String>) conditionValue, context);
                case "requiredScopes" -> checkRequiredScopes((List<String>) conditionValue, context);
                case "minTrustLevel" -> checkMinTrustLevel(conditionValue, context);
                default -> {
                    log.warn("Unknown condition type: {}", conditionType);
                    yield true; // Unknown conditions pass by default
                }
            };

            if (!met) {
                log.debug("Condition '{}' not met", conditionType);
                return false;
            }
        }

        return true;
    }

    private boolean checkTimeWindow(Map<String, Object> timeWindow) {
        if (timeWindow == null) return true;

        String timezone = (String) timeWindow.getOrDefault("timezone", "UTC");
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of(timezone));

        // Check day of week
        Object daysObj = timeWindow.get("daysOfWeek");
        if (daysObj instanceof List<?> days) {
            int todayValue = now.getDayOfWeek().getValue();
            boolean dayAllowed = days.stream()
                    .mapToInt(d -> d instanceof Integer i ? i : Integer.parseInt(d.toString()))
                    .anyMatch(d -> d == todayValue);
            if (!dayAllowed) return false;
        }

        // Check time range
        String startStr = (String) timeWindow.get("start");
        String endStr = (String) timeWindow.get("end");
        if (startStr != null && endStr != null) {
            int nowMinutes = now.getHour() * 60 + now.getMinute();
            int startMinutes = parseTimeToMinutes(startStr);
            int endMinutes = parseTimeToMinutes(endStr);

            if (startMinutes <= endMinutes) {
                return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
            } else {
                // Overnight window (e.g., 22:00 to 06:00)
                return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
            }
        }

        return true;
    }

    private boolean checkMaxRiskScore(Object threshold, EvaluationContext context) {
        double maxRisk = threshold instanceof Number n ? n.doubleValue() : Double.parseDouble(threshold.toString());
        return context.getAgentRiskScore() <= maxRisk;
    }

    private boolean checkIpAllowlist(List<String> allowedIps, EvaluationContext context) {
        if (allowedIps == null || allowedIps.isEmpty()) return true;
        String clientIp = context.getIpAddress();
        if (clientIp == null) return false;
        // Simple exact match for now (CIDR support can be added later)
        return allowedIps.stream().anyMatch(ip -> ip.equals(clientIp) || clientIp.startsWith(ip.replace("/24", "").replace("/16", "").replace("/8", "")));
    }

    private boolean checkRequiredScopes(List<String> requiredScopes, EvaluationContext context) {
        if (requiredScopes == null || requiredScopes.isEmpty()) return true;
        List<String> sessionScopes = context.getScopes();
        if (sessionScopes == null || sessionScopes.isEmpty()) return false;
        if (sessionScopes.contains("*")) return true;
        return sessionScopes.containsAll(requiredScopes);
    }

    private boolean checkMinTrustLevel(Object threshold, EvaluationContext context) {
        int minTrust = threshold instanceof Number n ? n.intValue() : Integer.parseInt(threshold.toString());
        return context.getAgentTrustLevel() >= minTrust;
    }

    private int parseTimeToMinutes(String time) {
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
}
