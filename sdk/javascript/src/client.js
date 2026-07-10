/**
 * 🛡️ SENTRIX — JavaScript/Node.js SDK Client
 * 
 * Enterprise-grade AI Agent Governance, Runtime IAM & Anomaly Detection.
 * 
 * Usage:
 *   const SentrixClient = require('sentrix-sdk');
 *   const client = new SentrixClient('https://your-server.com', 'your-api-key');
 *   await client.authenticate();
 *   const decision = await client.authorize('READ', '/api/v1/users');
 * 
 * @module sentrix-sdk
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal Logger
// ─────────────────────────────────────────────────────────────────────────────

const logger = {
  info: (msg) => console.log(`[INFO] [sentrix-sdk] ${msg}`),
  warn: (msg) => console.warn(`[WARN] [sentrix-sdk] ${msg}`),
  error: (msg) => console.error(`[ERROR] [sentrix-sdk] ${msg}`),
  debug: (msg) => {
    if (process.env.SENTRIX_DEBUG === 'true') {
      console.debug(`[DEBUG] [sentrix-sdk] ${msg}`);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base error class for all Sentrix SDK errors.
 */
class SentrixError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SentrixError';
  }
}

/**
 * Raised when agent authentication fails after all retries.
 */
class AuthenticationError extends SentrixError {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Raised when an authorization request fails unexpectedly.
 */
class AuthorizationError extends SentrixError {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Raised when the SDK is misconfigured (missing API key, invalid URL, etc.).
 */
class ConfigurationError extends SentrixError {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Authorization Decision
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents the result of an authorization check.
 * 
 * @example
 * const decision = await client.authorize('READ', '/data');
 * if (decision.allowed) {
 *   console.log('Access granted');
 * }
 * console.log(decision.riskScore);       // 0.0 - 1.0
 * console.log(decision.matchedPolicies); // ['policy-1', 'policy-2']
 * console.log(decision.reason);          // 'Denied by policy X'
 */
class AuthorizationDecision {
  /**
   * @param {boolean} allowed - Whether the action is authorized
   * @param {Object} responseData - Full response from Sentrix API
   */
  constructor(allowed, responseData = {}) {
    /** @type {boolean} Whether the action is authorized */
    this.allowed = allowed;
    /** @type {Object} Full response data from the Sentrix authorization API */
    this.responseData = responseData;
    /** @type {number|null} ML-computed risk score (0.0 – 1.0) */
    this.riskScore = responseData.riskScore || null;
    /** @type {string[]} List of policies that matched this request */
    this.matchedPolicies = responseData.matchedPolicies || [];
    /** @type {string|null} Human-readable reason for the decision */
    this.reason = responseData.reason || null;
  }

  /**
   * Returns a dictionary representation of the decision.
   * @returns {Object}
   */
  toJSON() {
    return {
      allowed: this.allowed,
      riskScore: this.riskScore,
      matchedPolicies: this.matchedPolicies,
      reason: this.reason,
      responseData: this.responseData,
    };
  }

  toString() {
    return `AuthorizationDecision(allowed=${this.allowed}, riskScore=${this.riskScore})`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The main Sentrix SDK client for AI agent governance and security.
 * 
 * Provides authentication, authorization, audit logging, and session
 * management against a Sentrix backend server.
 * 
 * @example
 * // Basic usage
 * const SentrixClient = require('sentrix-sdk');
 * const client = new SentrixClient('https://your-server.com', 'sx_live_...');
 * await client.authenticate();
 * const decision = await client.authorize('READ', '/api/v1/users');
 * 
 * @example
 * // Environment variable config
 * // Set SENTRIX_BASE_URL and SENTRIX_API_KEY, then:
 * const client = new SentrixClient();
 * await client.authenticate();
 * 
 * @example
 * // With session lifecycle
 * await client.withSession(async (c) => {
 *   const decision = await c.authorize('READ', '/data');
 * });
 */
class SentrixClient {
  static VERSION = '1.0.0';

  /**
   * Creates a new SentrixClient instance.
   * 
   * @param {string} [baseUrl] - Sentrix server URL (default: SENTRIX_BASE_URL env or 'http://localhost:8080')
   * @param {string|null} [apiKey] - Agent API key (default: SENTRIX_API_KEY env)
   * @param {Object} [options] - Additional configuration
   * @param {number} [options.timeout=10000] - Request timeout in milliseconds
   * @param {number} [options.maxRetries=3] - Maximum retry attempts
   */
  constructor(baseUrl = null, apiKey = null, options = {}) {
    const env = typeof process !== 'undefined' ? process.env : {};
    
    /** @type {string} */
    this.baseUrl = (baseUrl || env.SENTRIX_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    /** @type {string|null} */
    this.apiKey = apiKey || env.SENTRIX_API_KEY || null;
    /** @type {number} */
    this.timeout = options.timeout || parseInt(env.SENTRIX_TIMEOUT || '10000', 10);
    /** @type {number} */
    this.maxRetries = options.maxRetries || parseInt(env.SENTRIX_MAX_RETRIES || '3', 10);
    
    /** @type {string|null} */
    this.sessionToken = null;
    /** @type {string|null} */
    this.agentId = null;
    /** @type {string|null} */
    this.sessionId = null;

    // Internal state
    this._heartbeatInterval = null;
    this._stats = {
      totalRequests: 0,
      authCalls: 0,
      authorizeCalls: 0,
      logCalls: 0,
      errors: 0,
    };
  }

  // ── Core Methods ─────────────────────────────────────────────────────

  /**
   * Authenticates the agent against the Sentrix backend using its API key.
   * Stores session token, agent ID, and session ID internally.
   * 
   * Retries up to maxRetries times with exponential backoff.
   * 
   * @param {string|null} [apiKey] - Override API key
   * @returns {Promise<boolean>} True if authentication succeeded
   * @throws {ConfigurationError} If no API key is available
   * @throws {AuthenticationError} If auth fails after all retries
   */
  async authenticate(apiKey = null) {
    const key = apiKey || this.apiKey;
    if (!key) {
      throw new ConfigurationError(
        'API key is required. Provide it via:\n' +
        "  • new SentrixClient(url, 'your-key')\n" +
        '  • Environment variable SENTRIX_API_KEY\n' +
        "  • client.authenticate('your-key')"
      );
    }

    const url = `${this.baseUrl}/api/v1/agent/authenticate`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this._stats.authCalls++;
        this._stats.totalRequests++;

        const response = await this._fetch(url, {
          method: 'POST',
          headers: {
            'X-API-Key': key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          this.sessionToken = data.sessionToken;
          this.agentId = data.agentId;
          this.sessionId = data.sessionId;
          logger.info(`Authenticated agent (id=${this.agentId})`);
          return true;
        } else if (response.status === 401) {
          throw new AuthenticationError(`Invalid API key: ${await response.text()}`);
        } else if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || String(Math.pow(2, attempt)), 10);
          logger.warn(`Rate limited. Retrying in ${retryAfter}s...`);
          await this._sleep(retryAfter * 1000);
          continue;
        } else {
          logger.warn(`Auth failed (attempt ${attempt + 1}/${this.maxRetries}): HTTP ${response.status}`);
        }
      } catch (err) {
        if (err instanceof AuthenticationError) throw err;
        this._stats.errors++;
        logger.error(`Network error during auth: ${err.message}`);
      }

      if (attempt < this.maxRetries - 1) {
        await this._sleep(Math.pow(2, attempt) * 1000);
      }
    }

    throw new AuthenticationError(
      `Authentication failed after ${this.maxRetries} attempts. ` +
      `Verify your API key and server URL (${this.baseUrl}).`
    );
  }

  /**
   * Checks whether the agent is authorized to perform the given action
   * on the specified resource.
   * 
   * This is the core method for runtime access control. It evaluates
   * the agent's policies, context conditions, and ML anomaly scores.
   * 
   * @param {string} action - The action to authorize (e.g., 'READ', 'WRITE', 'DELETE')
   * @param {string} resource - The resource path (e.g., '/api/v1/users')
   * @param {Object} [context={}] - Optional context for policy evaluation
   * @param {string} [context.ip] - Source IP address
   * @param {string} [context.environment] - 'production', 'staging', etc.
   * @param {Object} [options={}] - Additional options
   * @param {boolean} [options.autoAuthenticate=true] - Auto-authenticate if no session
   * @returns {Promise<AuthorizationDecision>} Authorization decision
   * 
   * @example
   * const decision = await client.authorize('WRITE', '/api/financial-data', {
   *   ip: '10.0.0.50',
   *   environment: 'production',
   *   department: 'finance',
   * });
   * console.log(decision.allowed);    // true or false
   * console.log(decision.riskScore);  // 0.0 - 1.0
   */
  async authorize(action, resource, context = {}, options = {}) {
    const { autoAuthenticate = true } = options;

    if (!this.sessionToken) {
      if (autoAuthenticate) {
        await this.authenticate();
      } else {
        return new AuthorizationDecision(false, {
          reason: 'No active session. Call authenticate() first.',
        });
      }
    }

    const url = `${this.baseUrl}/api/v1/agent/authorize`;
    const payload = { action, resource, context };

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this._stats.authorizeCalls++;
        this._stats.totalRequests++;

        const response = await this._fetch(url, {
          method: 'POST',
          headers: this._sessionHeaders(),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const decision = data.decision || 'DENY';
          return new AuthorizationDecision(
            decision === 'ALLOW' || decision === 'ALLOWED',
            data
          );
        } else if (response.status === 401) {
          logger.info('Session expired. Re-authenticating...');
          try {
            await this.authenticate();
            // Retry with fresh token
            const retryResponse = await this._fetch(url, {
              method: 'POST',
              headers: this._sessionHeaders(),
              body: JSON.stringify(payload),
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              return new AuthorizationDecision(
                (data.decision || 'DENY') === 'ALLOW' || data.decision === 'ALLOWED',
                data
              );
            }
          } catch (authErr) {
            // Re-auth failed, fall through
          }
        } else if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || String(Math.pow(2, attempt)), 10);
          logger.warn(`Rate limited. Retrying in ${retryAfter}s...`);
          await this._sleep(retryAfter * 1000);
          continue;
        }
      } catch (err) {
        this._stats.errors++;
        logger.error(`Network error during authorization: ${err.message}`);
      }

      if (attempt < this.maxRetries - 1) {
        await this._sleep(Math.pow(2, attempt) * 1000);
      }
    }

    return new AuthorizationDecision(false, {
      reason: 'Authorization request failed after retries.',
    });
  }

  /**
   * Logs a behavioral/audit event to the Sentrix governance system.
   * 
   * Events are stored in the immutable SHA-256 audit chain and used
   * by the ML anomaly detection engine for behavioral profiling.
   * 
   * @param {string} action - The action performed
   * @param {string} resource - The resource acted upon
   * @param {string} outcome - Result: 'SUCCESS', 'FAILURE', 'ERROR', or 'DENIED'
   * @param {number} [latencyMs=0] - Action duration in milliseconds
   * @param {Object} [metadata={}] - Optional extra metadata
   * @returns {Promise<boolean>} True if the log was submitted successfully
   */
  async logAction(action, resource, outcome, latencyMs = 0, metadata = {}) {
    if (!this.sessionToken) {
      try {
        await this.authenticate();
      } catch (err) {
        return false;
      }
    }

    const url = `${this.baseUrl}/api/v1/agent/log`;
    const payload = { action, resource, outcome, latencyMs, metadata };

    try {
      this._stats.logCalls++;
      this._stats.totalRequests++;

      const response = await this._fetch(url, {
        method: 'POST',
        headers: this._sessionHeaders(),
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch (err) {
      this._stats.errors++;
      logger.error(`Failed to submit audit log: ${err.message}`);
      return false;
    }
  }

  /**
   * Sends a keep-alive heartbeat for the current agent session.
   * @returns {Promise<boolean>} True if heartbeat was acknowledged
   */
  async heartbeat() {
    if (!this.sessionToken) return false;

    const url = `${this.baseUrl}/api/v1/agent/heartbeat`;
    try {
      this._stats.totalRequests++;
      const response = await this._fetch(url, {
        method: 'POST',
        headers: this._sessionHeaders(),
      });
      return response.ok;
    } catch (err) {
      this._stats.errors++;
      logger.error(`Heartbeat failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Terminates the active session and clears all tokens.
   * @returns {Promise<boolean>} True if logout succeeded
   */
  async logout() {
    if (!this.sessionToken) return true;

    const url = `${this.baseUrl}/api/v1/agent/logout`;
    try {
      this._stats.totalRequests++;
      const response = await this._fetch(url, {
        method: 'POST',
        headers: this._sessionHeaders(),
      });
      return response.ok || response.status === 204;
    } catch (err) {
      return false;
    } finally {
      this._clearSession();
    }
  }

  // ── Advanced Features ────────────────────────────────────────────────

  /**
   * Simple boolean authorization check — no exceptions, no frills.
   * 
   * @param {string} action - The action to authorize
   * @param {string} resource - The resource path
   * @param {Object} [context={}] - Optional context
   * @returns {Promise<boolean>} True if allowed, false if denied
   * 
   * @example
   * if (await client.check('READ', '/data')) {
   *   // proceed
   * }
   */
  async check(action, resource, context = {}) {
    const decision = await this.authorize(action, resource, context);
    return decision.allowed;
  }

  /**
   * Wraps a function with Sentrix authorization.
   * 
   * Before the function executes, checks authorization.
   * After execution, logs the action outcome.
   * If denied, throws an Error or calls the onDeny callback.
   * 
   * @param {string} action - The action to authorize
   * @param {string} resource - The resource being accessed
   * @param {Function} fn - The function to protect
   * @param {Object} [options={}] - Options
   * @param {Object} [options.context={}] - Authorization context
   * @param {Function} [options.onDeny] - Called when denied: (action, resource, decision) => result
   * @returns {Function} Protected function
   * 
   * @example
   * const safeQuery = client.protect('db:query', '/database/customers', async () => {
   *   return await db.query('SELECT * FROM customers');
   * });
   * const result = await safeQuery(); // Checks auth first, logs after
   */
  protect(action, resource, fn, options = {}) {
    const { context = {}, onDeny = null } = options;
    const client = this;

    return async function protectedFn(...args) {
      const decision = await client.authorize(action, resource, context);

      if (!decision.allowed) {
        if (onDeny) {
          return onDeny(action, resource, decision);
        }
        throw new Error(
          `Sentrix denied access: action='${action}', ` +
          `resource='${resource}', reason='${decision.reason}'`
        );
      }

      const startTime = Date.now();
      let outcome = 'SUCCESS';
      try {
        const result = await fn(...args);
        return result;
      } catch (err) {
        outcome = 'ERROR';
        throw err;
      } finally {
        const elapsed = Date.now() - startTime;
        await client.logAction(action, resource, outcome, elapsed);
      }
    };
  }

  /**
   * Executes a callback within a managed session lifecycle.
   * 
   * Authenticates → starts heartbeat → runs callback → stops heartbeat → logout.
   * 
   * @param {Function} callback - Async function receiving the client as argument
   * @param {Object} [options={}] - Options
   * @param {number} [options.heartbeatInterval=30000] - Heartbeat interval (ms)
   * @returns {Promise<*>} The return value of the callback
   * 
   * @example
   * const result = await client.withSession(async (c) => {
   *   const decision = await c.authorize('READ', '/data');
   *   return decision.allowed;
   * });
   */
  async withSession(callback, options = {}) {
    const { heartbeatInterval = 30000 } = options;

    await this.authenticate();
    this.startHeartbeat(heartbeatInterval);

    try {
      return await callback(this);
    } finally {
      this.stopHeartbeat();
      await this.logout();
    }
  }

  /**
   * Starts an automatic background heartbeat.
   * 
   * Keeps the agent session alive by sending periodic heartbeats.
   * Call stopHeartbeat() to clean up.
   * 
   * @param {number} [intervalMs=30000] - Milliseconds between heartbeats (default: 30s)
   */
  startHeartbeat(intervalMs = 30000) {
    if (this._heartbeatInterval) {
      logger.warn('Heartbeat is already running.');
      return;
    }

    this._heartbeatInterval = setInterval(() => {
      this.heartbeat().catch(() => {});
    }, intervalMs);

    // Ensure interval doesn't prevent process exit
    if (this._heartbeatInterval.unref) {
      this._heartbeatInterval.unref();
    }

    logger.info(`Background heartbeat started (every ${intervalMs / 1000}s)`);
  }

  /**
   * Stops the automatic background heartbeat.
   */
  stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
      logger.info('Background heartbeat stopped.');
    }
  }

  /**
   * Returns SDK usage statistics for the current session.
   * 
   * @returns {Object} Stats object with totalRequests, authCalls, authorizeCalls, logCalls, errors
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * Returns true if the client has an active session token.
   * @returns {boolean}
   */
  get isAuthenticated() {
    return this.sessionToken !== null;
  }

  /**
   * Creates an Express/Connect middleware for Sentrix authorization.
   * 
   * Intercepts every request and checks authorization before allowing it through.
   * If denied, responds with 403 Forbidden.
   * 
   * @param {Object} [options={}] - Middleware options
   * @param {Function} [options.actionFrom] - Extract action from req (default: req.method)
   * @param {Function} [options.resourceFrom] - Extract resource from req (default: req.path)
   * @param {Function} [options.contextFrom] - Extract context from req (default: { ip: req.ip })
   * @param {string[]} [options.exclude=[]] - Paths to exclude from auth checks
   * @returns {Function} Express middleware function
   * 
   * @example
   * const express = require('express');
   * const SentrixClient = require('sentrix-sdk');
   * 
   * const app = express();
   * const sentrix = new SentrixClient('https://server.com', 'key');
   * await sentrix.authenticate();
   * 
   * app.use(sentrix.expressMiddleware({
   *   exclude: ['/health', '/public'],
   * }));
   * 
   * app.get('/api/data', (req, res) => {
   *   res.json({ secure: true });
   * });
   */
  expressMiddleware(options = {}) {
    const {
      actionFrom = (req) => req.method,
      resourceFrom = (req) => req.path,
      contextFrom = (req) => ({ ip: req.ip || req.connection?.remoteAddress }),
      exclude = [],
    } = options;

    const client = this;

    return async function sentrixMiddleware(req, res, next) {
      // Skip excluded paths
      if (exclude.some(path => req.path.startsWith(path))) {
        return next();
      }

      try {
        const decision = await client.authorize(
          actionFrom(req),
          resourceFrom(req),
          contextFrom(req)
        );

        if (decision.allowed) {
          req.sentrixDecision = decision;
          return next();
        } else {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied by Sentrix policy',
            reason: decision.reason,
            riskScore: decision.riskScore,
          });
        }
      } catch (err) {
        logger.error(`Middleware error: ${err.message}`);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Sentrix authorization check failed',
        });
      }
    };
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  /**
   * Internal fetch wrapper with timeout support.
   * @private
   */
  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `sentrix-sdk-js/${SentrixClient.VERSION}`,
          ...(options.headers || {}),
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Returns headers for authenticated session requests.
   * @private
   */
  _sessionHeaders() {
    return {
      'Authorization': `Bearer ${this.sessionToken}`,
      'X-Agent-Id': this.agentId,
      'X-Session-Id': this.sessionId,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Clears all session data.
   * @private
   */
  _clearSession() {
    this.sessionToken = null;
    this.agentId = null;
    this.sessionId = null;
  }

  /**
   * Promise-based sleep.
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = SentrixClient;
module.exports.SentrixClient = SentrixClient;
module.exports.AuthorizationDecision = AuthorizationDecision;
module.exports.SentrixError = SentrixError;
module.exports.AuthenticationError = AuthenticationError;
module.exports.AuthorizationError = AuthorizationError;
module.exports.ConfigurationError = ConfigurationError;
