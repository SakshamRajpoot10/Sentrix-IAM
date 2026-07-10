package com.sentrix.scheduler;

import com.sentrix.entity.Agent;
import com.sentrix.repository.AgentRepository;
import com.sentrix.service.MlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduled job for ML baseline recalculation every 15 minutes.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class BaselineRecalculationJob {

    private final AgentRepository agentRepository;
    private final MlService mlService;

    @Scheduled(fixedRate = 900000) // 15 minutes
    public void recalculateBaselines() {
        log.info("Baseline recalculation job started");
        try {
            List<Agent> activeAgents = agentRepository.findAll().stream()
                    .filter(Agent::isActive)
                    .toList();

            for (Agent agent : activeAgents) {
                try {
                    mlService.computeBaseline(agent.getId());
                } catch (Exception e) {
                    log.error("Failed to trigger baseline computation for agent {}: {}", agent.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error in baseline recalculation: {}", e.getMessage());
        }
        log.info("Baseline recalculation job completed");
    }
}
