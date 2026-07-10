/**
 * Sentrix SDK — TypeScript Type Declarations
 *
 * Provides full type support for TypeScript users of the sentrix-sdk package.
 */

/**
 * Represents the result of an authorization check.
 */
export class AuthorizationDecision {
    /** Whether the action is authorized. */
    allowed: boolean;

    /** The full response data from the Sentrix authorization API. */
    responseData: Record<string, any>;

    constructor(allowed: boolean, responseData?: Record<string, any>);

    toString(): string;
}

/**
 * Configuration options for creating a SentrixClient instance.
 */
export interface SentrixClientOptions {
    /** Base URL of the Sentrix backend server. */
    baseUrl?: string;

    /** Agent API key for authentication. */
    apiKey?: string | null;
}

/**
 * Context object passed to authorization requests for policy evaluation.
 */
export interface AuthorizationContext {
    /** Source IP address of the requesting agent. */
    ip?: string;

    /** Deployment environment (e.g., "production", "staging"). */
    environment?: string;

    /** Any additional context key-value pairs. */
    [key: string]: any;
}

/**
 * Metadata object for action logging.
 */
export interface ActionMetadata {
    [key: string]: any;
}

/**
 * The main Sentrix SDK client for AI agent governance and security.
 *
 * @example
 * ```typescript
 * import SentrixClient from 'sentrix-sdk';
 *
 * const client = new SentrixClient('https://your-server.com', 'your-api-key');
 * await client.authenticate();
 *
 * const decision = await client.authorize('READ', '/api/v1/users');
 * if (decision.allowed) {
 *     console.log('Access granted!');
 * }
 * ```
 */
declare class SentrixClient {
    /** Base URL of the Sentrix backend server. */
    baseUrl: string;

    /** Agent API key. */
    apiKey: string | null;

    /** Active session token (set after authentication). */
    sessionToken: string | null;

    /** Authenticated agent ID (set after authentication). */
    agentId: string | null;

    /** Active session ID (set after authentication). */
    sessionId: string | null;

    /**
     * Creates a new SentrixClient instance.
     *
     * @param baseUrl - URL of the Sentrix backend server (default: "http://localhost:8080")
     * @param apiKey - Agent API key for authentication (default: null)
     */
    constructor(baseUrl?: string, apiKey?: string | null);

    /**
     * Authenticates the agent against the Sentrix backend using its API key.
     * Stores session token, agent ID, and session ID internally.
     *
     * Retries up to 3 times with exponential backoff on failure.
     *
     * @param apiKey - Optional override API key (uses constructor key if not provided)
     * @returns `true` if authentication succeeded, `false` otherwise
     */
    authenticate(apiKey?: string | null): Promise<boolean>;

    /**
     * Checks whether the agent is authorized to perform the given action
     * on the specified resource.
     *
     * Auto-authenticates if no active session exists.
     * Auto-refreshes expired sessions.
     *
     * @param action - The action to authorize (e.g., "READ", "WRITE", "DELETE")
     * @param resource - The resource path (e.g., "/api/v1/users")
     * @param context - Optional context for policy evaluation (IP, environment, etc.)
     * @returns AuthorizationDecision indicating whether the action is allowed
     */
    authorize(
        action: string,
        resource: string,
        context?: AuthorizationContext
    ): Promise<AuthorizationDecision>;

    /**
     * Logs a behavioral/audit event to the Sentrix governance system.
     *
     * @param action - The action performed
     * @param resource - The resource acted upon
     * @param outcome - Result of the action (e.g., "SUCCESS", "FAILURE", "ERROR")
     * @param latencyMs - Action duration in milliseconds (default: 0)
     * @param metadata - Optional additional metadata
     * @returns `true` if the log was submitted successfully
     */
    logAction(
        action: string,
        resource: string,
        outcome: string,
        latencyMs?: number,
        metadata?: ActionMetadata
    ): Promise<boolean>;

    /**
     * Sends a keep-alive heartbeat for the current agent session.
     *
     * @returns `true` if the heartbeat was acknowledged
     */
    heartbeat(): Promise<boolean>;

    /**
     * Terminates the active session and clears all tokens.
     *
     * @returns `true` if logout succeeded
     */
    logout(): Promise<boolean>;
}

export default SentrixClient;
export { SentrixClient };
