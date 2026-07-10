package com.sentrix.controller;

import com.sentrix.dto.request.AuthorizeRequest;
import com.sentrix.dto.response.AuthorizeResponse;
import com.sentrix.service.AuthorizeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * SDK-facing endpoints for agent authentication and authorization.
 * These endpoints use API key authentication (not JWT admin tokens).
 */
@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
@Tag(name = "Agent SDK", description = "SDK endpoints for agent runtime")
public class AgentSdkController {

    private final AuthorizeService authorizeService;

    @PostMapping("/authenticate")
    @Operation(summary = "Authenticate agent with API key", description = "Returns a session JWT token")
    public ResponseEntity<Map<String, Object>> authenticate(
            @RequestHeader("X-API-Key") String apiKey,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request
    ) {
        @SuppressWarnings("unchecked")
        List<String> scopes = body != null && body.containsKey("scopes") ?
                (List<String>) body.get("scopes") : List.of("*");

        Map<String, Object> response = authorizeService.authenticateAgent(
                apiKey,
                scopes,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/authorize")
    @Operation(summary = "Authorize an agent action", description = "Evaluates policies and returns decision")
    public ResponseEntity<AuthorizeResponse> authorize(
            @RequestHeader("X-Agent-Id") UUID agentId,
            @RequestHeader(value = "X-Session-Id", required = false) UUID sessionId,
            @Valid @RequestBody AuthorizeRequest request,
            HttpServletRequest httpRequest
    ) {
        AuthorizeResponse response = authorizeService.authorize(
                agentId,
                sessionId,
                request,
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout agent session")
    public ResponseEntity<Void> logout(
            @RequestHeader("X-Agent-Id") UUID agentId,
            @RequestHeader("X-Session-Id") UUID sessionId
    ) {
        authorizeService.logoutAgent(agentId, sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/heartbeat")
    @Operation(summary = "Agent session heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(
            @RequestHeader("X-Agent-Id") UUID agentId,
            @RequestHeader("X-Session-Id") UUID sessionId
    ) {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "agentId", agentId.toString(),
                "sessionId", sessionId.toString(),
                "timestamp", java.time.Instant.now().toString()
        ));
    }
}
