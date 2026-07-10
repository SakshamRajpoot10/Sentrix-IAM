package com.sentrix.service;

import com.sentrix.dto.request.AuthorizeRequest;
import com.sentrix.dto.response.AuthorizeResponse;
import com.sentrix.engine.EvaluationContext;
import com.sentrix.engine.PolicyEngine;
import com.sentrix.engine.PolicyEngineResult;
import com.sentrix.entity.Agent;
import com.sentrix.entity.AgentSession;
import com.sentrix.entity.BehavioralEvent;
import com.sentrix.enums.AgentStatus;
import com.sentrix.exception.AuthenticationException;
import com.sentrix.exception.AuthorizationDeniedException;
import com.sentrix.repository.AgentRepository;
import com.sentrix.repository.AgentSessionRepository;
import com.sentrix.repository.BehavioralEventRepository;
import com.sentrix.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Runtime authorization service — called by agent SDKs.
 * Handles: authenticate (API key → session JWT), authorize (action check), log action.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthorizeService {

    private final AgentRepository agentRepository;
    private final AgentSessionRepository agentSessionRepository;
    private final BehavioralEventRepository behavioralEventRepository;
    private final PolicyEngine policyEngine;
    private final AuditService auditService;
    private final MlService mlService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.auto-revoke-threshold:0.8}")
    private double autoRevokeThreshold;

    // ─── Authenticate Agent (API Key → Session Token) ──────────

    @Transactional
    public Map<String, Object> authenticateAgent(String apiKey, List<String> scopes, String ipAddress, String userAgent) {
        // Extract prefix and find agent
        String prefix;
        try {
            prefix = apiKey.substring(8, 16); // After "ak_live_"
        } catch (Exception e) {
            throw new AuthenticationException("Invalid API key format");
        }

        Agent agent = agentRepository.findActiveByApiKeyPrefix(prefix)
                .orElseThrow(() -> new AuthenticationException("Invalid API key"));

        // Verify full API key against bcrypt hash
        if (!passwordEncoder.matches(apiKey, agent.getApiKeyHash())) {
            throw new AuthenticationException("Invalid API key");
        }

        if (!agent.isActive()) {
            throw new AuthenticationException("Agent is not active (status: " + agent.getStatus() + ")");
        }

        // Create session
        AgentSession session = AgentSession.builder()
                .agent(agent)
                .tokenHash("pending") // Will be updated with actual hash
                .scopes(scopes != null && !scopes.isEmpty() ? scopes : List.of("*"))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .expiresAt(Instant.now().plusSeconds(3600)) // 1 hour
                .build();

        session = agentSessionRepository.save(session);

        // Generate session JWT
        String sessionToken = jwtTokenProvider.generateAgentSessionToken(agent.getId(), session.getId());

        // Update token hash
        session.setTokenHash(com.sentrix.util.HashChainUtil.sha256(sessionToken));
        agentSessionRepository.save(session);

        // Update last active
        agent.setLastActiveAt(Instant.now());
        agentRepository.save(agent);

        log.info("Agent authenticated: {} (session: {})", agent.getName(), session.getId());

        return Map.of(
                "sessionToken", sessionToken,
                "sessionId", session.getId().toString(),
                "agentId", agent.getId().toString(),
                "agentName", agent.getName(),
                "expiresAt", session.getExpiresAt().toString()
        );
    }

    // ─── Authorize Action ──────────────────────────────────────

    @Transactional
    public AuthorizeResponse authorize(
            UUID agentId,
            UUID sessionId,
            AuthorizeRequest request,
            String ipAddress,
            String userAgent
    ) {
        // Load agent with policies
        Agent agent = agentRepository.findByIdWithPolicies(agentId)
                .orElseThrow(() -> new AuthenticationException("Agent not found"));

        if (!agent.isActive()) {
            throw new AuthorizationDeniedException("Agent is not active");
        }

        // Build evaluation context
        EvaluationContext context = EvaluationContext.builder()
                .agentRiskScore(agent.getRiskScore())
                .agentTrustLevel(agent.getTrustLevel())
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .scopes(request.getScopes())
                .build();

        // Evaluate policies
        PolicyEngineResult result = policyEngine.evaluate(agent, request.getAction(), request.getResource(), context);

        // Get risk score from ML (async, non-blocking — fallback to 0.0)
        double riskScore = agent.getRiskScore();
        try {
            riskScore = mlService.getRiskScore(agentId);
        } catch (Exception e) {
            log.warn("ML service unavailable, using cached risk score: {}", riskScore);
        }

        // Record behavioral event
        BehavioralEvent event = BehavioralEvent.builder()
                .agentId(agentId)
                .eventType("AUTHORIZATION")
                .action(request.getAction())
                .resource(request.getResource())
                .outcome(result.getDecision().name())
                .build();
        behavioralEventRepository.save(event);

        // Create audit log entry
        auditService.createEntry(
                agent.getOrganization().getId(),
                agentId,
                sessionId,
                request.getAction(),
                request.getResource(),
                result.getDecision(),
                riskScore,
                result.getMatchedPolicyId() != null ? UUID.fromString(result.getMatchedPolicyId()) : null,
                result.getReason(),
                ipAddress,
                userAgent,
                request.getContext()
        );

        // Auto-revoke on high risk
        if (riskScore >= autoRevokeThreshold) {
            log.warn("⚠️ AUTO-REVOKE: Agent {} risk score {} exceeds threshold {}",
                    agent.getName(), riskScore, autoRevokeThreshold);
            agent.setStatus(AgentStatus.SUSPENDED);
            agentSessionRepository.revokeAllActiveSessions(agentId);
            agentRepository.save(agent);
        }

        // Update agent last active
        agent.setLastActiveAt(Instant.now());
        agentRepository.save(agent);

        return AuthorizeResponse.builder()
                .allowed(result.isAllowed())
                .decision(result.getDecision().name())
                .riskScore(riskScore)
                .reason(result.getReason())
                .policyId(result.getMatchedPolicyId())
                .policyName(result.getMatchedPolicyName())
                .build();
    }

    // ─── Logout Agent Session ──────────────────────────────────

    @Transactional
    public void logoutAgent(UUID agentId, UUID sessionId) {
        agentSessionRepository.findById(sessionId).ifPresent(session -> {
            if (session.getAgent().getId().equals(agentId)) {
                session.setStatus(com.sentrix.enums.SessionStatus.REVOKED);
                agentSessionRepository.save(session);
                log.info("Agent session revoked: {} (agent: {})", sessionId, agentId);
            }
        });
    }
}
