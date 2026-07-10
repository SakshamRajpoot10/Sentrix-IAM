package com.sentrix.scheduler;

import com.sentrix.repository.AgentSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Cleans up expired agent sessions every 5 minutes.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SessionCleanupJob {

    private final AgentSessionRepository agentSessionRepository;

    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupExpiredSessions() {
        agentSessionRepository.expireOldSessions(Instant.now());
        log.debug("Expired sessions cleaned up");
    }
}
