package com.sentrix.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

/**
 * HTTP client for the Python ML service (FastAPI).
 * Calls /predict, /baseline, /model/info endpoints.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MlService {

    private final WebClient.Builder webClientBuilder;

    @Value("${ml.service-url:http://localhost:8000}")
    private String mlServiceUrl;

    @Value("${ml.api-key:sentrix-ml-internal-key}")
    private String mlApiKey;

    @Value("${ml.enabled:true}")
    private boolean mlEnabled;

    /**
     * Get risk score from ML service for an agent.
     * Returns 0.0 if ML is disabled or service is unavailable.
     */
    @SuppressWarnings("unchecked")
    public double getRiskScore(UUID agentId) {
        if (!mlEnabled) return 0.0;

        try {
            Map<String, Object> response = webClientBuilder.build()
                    .post()
                    .uri(mlServiceUrl + "/predict")
                    .header("X-API-Key", mlApiKey)
                    .bodyValue(Map.of("agent_id", agentId.toString()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(java.time.Duration.ofSeconds(5));

            if (response != null && response.containsKey("risk_score")) {
                Object score = response.get("risk_score");
                return score instanceof Number n ? n.doubleValue() : 0.0;
            }
        } catch (Exception e) {
            log.warn("ML service call failed for agent {}: {}", agentId, e.getMessage());
        }

        return 0.0;
    }

    /**
     * Request baseline computation for an agent.
     */
    public void computeBaseline(UUID agentId) {
        if (!mlEnabled) return;

        try {
            webClientBuilder.build()
                    .post()
                    .uri(mlServiceUrl + "/baseline/" + agentId)
                    .header("X-API-Key", mlApiKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .subscribe(
                            result -> log.info("Baseline computed for agent {}", agentId),
                            error -> log.warn("Baseline computation failed for agent {}: {}", agentId, error.getMessage())
                    );
        } catch (Exception e) {
            log.warn("Failed to trigger baseline computation: {}", e.getMessage());
        }
    }

    /**
     * Get ML model info.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getModelInfo() {
        if (!mlEnabled) return Map.of("enabled", false);

        try {
            return webClientBuilder.build()
                    .get()
                    .uri(mlServiceUrl + "/model/info")
                    .header("X-API-Key", mlApiKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(java.time.Duration.ofSeconds(5));
        } catch (Exception e) {
            log.warn("ML model info unavailable: {}", e.getMessage());
            return Map.of("enabled", true, "status", "unavailable", "error", e.getMessage());
        }
    }
}
