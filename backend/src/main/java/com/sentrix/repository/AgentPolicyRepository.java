package com.sentrix.repository;

import com.sentrix.entity.AgentPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentPolicyRepository extends JpaRepository<AgentPolicy, UUID> {

    List<AgentPolicy> findByAgentId(UUID agentId);

    List<AgentPolicy> findByPolicyId(UUID policyId);

    boolean existsByAgentIdAndPolicyId(UUID agentId, UUID policyId);

    void deleteByAgentIdAndPolicyId(UUID agentId, UUID policyId);
}
