package com.sentrix.controller;

import com.sentrix.dto.request.CreatePolicyRequest;
import com.sentrix.dto.request.UpdatePolicyRequest;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.dto.response.PolicyResponse;
import com.sentrix.security.SecurityUtils;
import com.sentrix.service.PolicyService;
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

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
@Tag(name = "Policies", description = "Policy management endpoints")
public class PolicyController {

    private final PolicyService policyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Create a new policy")
    public ResponseEntity<PolicyResponse> createPolicy(@Valid @RequestBody CreatePolicyRequest request) {
        PolicyResponse response = policyService.createPolicy(SecurityUtils.getCurrentUserOrgId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all policies")
    public ResponseEntity<PageResponse<PolicyResponse>> listPolicies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "priority") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(policyService.listPolicies(SecurityUtils.getCurrentUserOrgId(), PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get policy details")
    public ResponseEntity<PolicyResponse> getPolicy(@PathVariable UUID id) {
        return ResponseEntity.ok(policyService.getPolicy(SecurityUtils.getCurrentUserOrgId(), id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Update a policy")
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePolicyRequest request
    ) {
        return ResponseEntity.ok(policyService.updatePolicy(SecurityUtils.getCurrentUserOrgId(), id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Delete a policy")
    public ResponseEntity<Void> deletePolicy(@PathVariable UUID id) {
        policyService.deletePolicy(SecurityUtils.getCurrentUserOrgId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{policyId}/agents/{agentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Assign a policy to an agent")
    public ResponseEntity<Map<String, String>> assignPolicyToAgent(
            @PathVariable UUID policyId,
            @PathVariable UUID agentId
    ) {
        UUID adminId = SecurityUtils.getCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentUserOrgId();
        policyService.assignPolicyToAgent(orgId, policyId, agentId, adminId);
        return ResponseEntity.ok(Map.of("message", "Policy assigned successfully"));
    }

    @DeleteMapping("/{policyId}/agents/{agentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'AGENT_MANAGER')")
    @Operation(summary = "Unassign a policy from an agent")
    public ResponseEntity<Void> unassignPolicyFromAgent(
            @PathVariable UUID policyId,
            @PathVariable UUID agentId
    ) {
        policyService.unassignPolicyFromAgent(SecurityUtils.getCurrentUserOrgId(), policyId, agentId);
        return ResponseEntity.noContent().build();
    }
}
