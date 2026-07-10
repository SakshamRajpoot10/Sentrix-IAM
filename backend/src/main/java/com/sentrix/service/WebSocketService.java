package com.sentrix.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * WebSocket event broadcasting service.
 * Sends real-time events to the frontend dashboard via STOMP.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast an agent activity event to all subscribers.
     */
    public void broadcastEvent(Map<String, Object> event) {
        messagingTemplate.convertAndSend("/topic/events", event);
    }

    /**
     * Broadcast an anomaly detection event.
     */
    public void broadcastAnomaly(UUID agentId, String agentName, double riskScore) {
        Map<String, Object> event = Map.of(
                "type", "ANOMALY",
                "agentId", agentId.toString(),
                "agentName", agentName,
                "riskScore", riskScore,
                "timestamp", Instant.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/anomalies", event);
        log.warn("Anomaly broadcast: agent={}, riskScore={}", agentName, riskScore);
    }

    /**
     * Broadcast a policy violation event.
     */
    public void broadcastViolation(UUID agentId, String agentName, String action, String resource, String reason) {
        Map<String, Object> event = Map.of(
                "type", "VIOLATION",
                "agentId", agentId.toString(),
                "agentName", agentName,
                "action", action,
                "resource", resource,
                "reason", reason,
                "timestamp", Instant.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/violations", event);
    }

    /**
     * Send a user-specific alert.
     */
    public void sendUserAlert(String userId, Map<String, Object> alert) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/alerts", alert);
    }
}
