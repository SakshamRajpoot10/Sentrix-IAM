package com.sentrix.controller;

import com.sentrix.dto.request.CreateAgentRequest;
import com.sentrix.dto.request.UpdateAgentRequest;
import com.sentrix.dto.response.AgentCreatedResponse;
import com.sentrix.dto.response.AgentResponse;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.security.SecurityUtils;
import com.sentrix.service.AgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@Tag(name = "Agents", description = "Agent management endpoints")
public class AgentController {

    private final AgentService agentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Create a new agent", description = "Creates an agent and returns the API key (shown ONCE)")
    public ResponseEntity<AgentCreatedResponse> createAgent(@Valid @RequestBody CreateAgentRequest request) {
        UUID orgId = getOrgId();
        AgentCreatedResponse response = agentService.createAgent(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all agents")
    public ResponseEntity<PageResponse<AgentResponse>> listAgents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageResponse<AgentResponse> response = agentService.listAgents(getOrgId(), PageRequest.of(page, size, sort));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get agent details")
    public ResponseEntity<AgentResponse> getAgent(@PathVariable UUID id) {
        return ResponseEntity.ok(agentService.getAgent(getOrgId(), id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Update an agent")
    public ResponseEntity<AgentResponse> updateAgent(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAgentRequest request
    ) {
        return ResponseEntity.ok(agentService.updateAgent(getOrgId(), id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Decommission an agent")
    public ResponseEntity<Void> deleteAgent(@PathVariable UUID id) {
        agentService.deleteAgent(getOrgId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Suspend an agent and revoke all sessions")
    public ResponseEntity<AgentResponse> suspendAgent(@PathVariable UUID id) {
        return ResponseEntity.ok(agentService.suspendAgent(getOrgId(), id));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Activate a suspended agent")
    public ResponseEntity<AgentResponse> activateAgent(@PathVariable UUID id) {
        return ResponseEntity.ok(agentService.activateAgent(getOrgId(), id));
    }

    @PostMapping("/{id}/regenerate-key")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Regenerate agent API key")
    public ResponseEntity<AgentCreatedResponse> regenerateApiKey(@PathVariable UUID id) {
        return ResponseEntity.ok(agentService.regenerateApiKey(getOrgId(), id));
    }

    private UUID getOrgId() {
        return SecurityUtils.getCurrentUserOrgId();
    }
}
