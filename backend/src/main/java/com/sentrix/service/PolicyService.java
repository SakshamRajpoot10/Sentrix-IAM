package com.sentrix.service;

import com.sentrix.dto.request.CreatePolicyRequest;
import com.sentrix.dto.request.UpdatePolicyRequest;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.dto.response.PolicyResponse;
import com.sentrix.entity.*;
import com.sentrix.enums.PolicyEffect;
import com.sentrix.enums.PolicyEnforcement;
import com.sentrix.exception.PlanLimitExceededException;
import com.sentrix.exception.ResourceNotFoundException;
import com.sentrix.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final OrganizationRepository organizationRepository;
    private final AgentRepository agentRepository;
    private final AgentPolicyRepository agentPolicyRepository;
    private final AdminUserRepository adminUserRepository;

    // ─── Create Policy ─────────────────────────────────────────

    @Transactional
    public PolicyResponse createPolicy(UUID orgId, CreatePolicyRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId.toString()));

        // Check plan limits
        long policyCount = policyRepository.countByOrganizationId(orgId);
        if (policyCount >= org.getPolicyLimit()) {
            throw new PlanLimitExceededException("Policy limit exceeded for organization", "policy", org.getPolicyLimit());
        }

        Policy policy = Policy.builder()
                .organization(org)
                .name(request.getName())
                .description(request.getDescription())
                .effect(request.getEffect() != null ? request.getEffect() : PolicyEffect.ALLOW)
                .enforcement(request.getEnforcement() != null ? request.getEnforcement() : PolicyEnforcement.ENFORCING)
                .priority(request.getPriority() != null ? request.getPriority() : 100)
                .rules(request.getRules())
                .conditions(request.getConditions())
                .build();

        policy = policyRepository.save(policy);
        log.info("Policy created: {} (id: {}, org: {})", policy.getName(), policy.getId(), org.getName());

        return toResponse(policy);
    }

    // ─── List Policies ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<PolicyResponse> listPolicies(UUID orgId, Pageable pageable) {
        Page<Policy> page = policyRepository.findByOrganizationId(orgId, pageable);

        var items = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<PolicyResponse>builder()
                .content(items)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    // ─── Get Policy ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PolicyResponse getPolicy(UUID orgId, UUID policyId) {
        Policy policy = findPolicyByOrgAndId(orgId, policyId);
        return toResponse(policy);
    }

    // ─── Update Policy ─────────────────────────────────────────

    @Transactional
    public PolicyResponse updatePolicy(UUID orgId, UUID policyId, UpdatePolicyRequest request) {
        Policy policy = findPolicyByOrgAndId(orgId, policyId);

        if (policy.getIsSystem()) {
            throw new IllegalStateException("System policies cannot be modified");
        }

        if (request.getName() != null) policy.setName(request.getName());
        if (request.getDescription() != null) policy.setDescription(request.getDescription());
        if (request.getEffect() != null) policy.setEffect(request.getEffect());
        if (request.getEnforcement() != null) policy.setEnforcement(request.getEnforcement());
        if (request.getPriority() != null) policy.setPriority(request.getPriority());
        if (request.getRules() != null) policy.setRules(request.getRules());
        if (request.getConditions() != null) policy.setConditions(request.getConditions());

        policy.setVersion(policy.getVersion() + 1);
        policy = policyRepository.save(policy);
        log.info("Policy updated: {} (id: {}, version: {})", policy.getName(), policy.getId(), policy.getVersion());

        return toResponse(policy);
    }

    // ─── Delete Policy ─────────────────────────────────────────

    @Transactional
    public void deletePolicy(UUID orgId, UUID policyId) {
        Policy policy = findPolicyByOrgAndId(orgId, policyId);
        if (policy.getIsSystem()) {
            throw new IllegalStateException("System policies cannot be deleted");
        }
        policyRepository.delete(policy);
        log.info("Policy deleted: {} (id: {})", policy.getName(), policy.getId());
    }

    // ─── Assign Policy to Agent ────────────────────────────────

    @Transactional
    public void assignPolicyToAgent(UUID orgId, UUID policyId, UUID agentId, UUID adminUserId) {
        Policy policy = findPolicyByOrgAndId(orgId, policyId);
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent", agentId.toString()));

        if (!agent.getOrganization().getId().equals(orgId)) {
            throw new ResourceNotFoundException("Agent", agentId.toString());
        }

        // Check if already assigned
        if (agentPolicyRepository.existsByAgentIdAndPolicyId(agentId, policyId)) {
            throw new IllegalStateException("Policy is already assigned to this agent");
        }

        AdminUser assignedBy = adminUserRepository.findById(adminUserId).orElse(null);

        AgentPolicy agentPolicy = AgentPolicy.builder()
                .agent(agent)
                .policy(policy)
                .assignedByUser(assignedBy)
                .build();

        agentPolicyRepository.save(agentPolicy);
        log.info("Policy '{}' assigned to agent '{}'", policy.getName(), agent.getName());
    }

    // ─── Unassign Policy from Agent ────────────────────────────

    @Transactional
    public void unassignPolicyFromAgent(UUID orgId, UUID policyId, UUID agentId) {
        agentPolicyRepository.deleteByAgentIdAndPolicyId(agentId, policyId);
        log.info("Policy {} unassigned from agent {}", policyId, agentId);
    }

    // ─── Helpers ───────────────────────────────────────────────

    private Policy findPolicyByOrgAndId(UUID orgId, UUID policyId) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy", policyId.toString()));
        if (!policy.getOrganization().getId().equals(orgId)) {
            throw new ResourceNotFoundException("Policy", policyId.toString());
        }
        return policy;
    }

    private PolicyResponse toResponse(Policy policy) {
        return PolicyResponse.builder()
                .id(policy.getId().toString())
                .name(policy.getName())
                .description(policy.getDescription())
                .effect(policy.getEffect().name())
                .enforcement(policy.getEnforcement().name())
                .priority(policy.getPriority())
                .rules(policy.getRules())
                .conditions(policy.getConditions())
                .isSystem(policy.getIsSystem())
                .version(policy.getVersion())
                .assignedAgents(policy.getAgentPolicies() != null ? policy.getAgentPolicies().size() : 0)
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }
}
