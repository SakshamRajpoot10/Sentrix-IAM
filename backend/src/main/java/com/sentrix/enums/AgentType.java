package com.sentrix.enums;

/**
 * Classification of AI agent autonomy levels.
 */
public enum AgentType {
    AUTONOMOUS,       // Fully autonomous — no human oversight
    SEMI_AUTONOMOUS,  // Requires human approval for high-risk actions
    SUPERVISED,       // Human reviews all actions before execution
    TOOL              // Non-autonomous tool agent (API wrapper)
}
