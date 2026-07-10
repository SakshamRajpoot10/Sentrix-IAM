# 🛡️ SENTRIX — Python SDK Client
# Enterprise-grade AI Agent Governance, Runtime IAM & Anomaly Detection
#
# Usage:
#   from sentrix import SentrixClient
#   client = SentrixClient("https://your-server.com", api_key="your-key")
#   client.authenticate()
#   decision = client.authorize("READ", "/api/v1/users")

import os
import time
import logging
import functools
import threading
from typing import Dict, Any, Optional, List, Callable, Union
from contextlib import contextmanager

import requests

logger = logging.getLogger("sentrix.sdk")

# ─────────────────────────────────────────────────────────────────────────────
# Data Models
# ─────────────────────────────────────────────────────────────────────────────

class AuthorizationDecision:
    """
    Represents the result of an authorization check.
    
    Behaves as a boolean: truthy when allowed, falsy when denied.
    Access the full server response via `.response_data`.
    
    Example:
        decision = client.authorize("READ", "/data")
        if decision:
            print("Allowed!")
        print(decision.response_data)  # Full server response dict
    """

    def __init__(self, allowed: bool, response_data: Optional[Dict[str, Any]] = None):
        self.allowed = allowed
        self.response_data = response_data or {}
        self.risk_score: Optional[float] = self.response_data.get("riskScore")
        self.matched_policies: List[str] = self.response_data.get("matchedPolicies", [])
        self.decision_reason: Optional[str] = self.response_data.get("reason")

    def __bool__(self) -> bool:
        return self.allowed

    def __repr__(self) -> str:
        return f"AuthorizationDecision(allowed={self.allowed}, risk_score={self.risk_score})"

    def to_dict(self) -> Dict[str, Any]:
        """Returns a dictionary representation of the decision."""
        return {
            "allowed": self.allowed,
            "risk_score": self.risk_score,
            "matched_policies": self.matched_policies,
            "reason": self.decision_reason,
            "response_data": self.response_data,
        }


class SentrixConfig:
    """
    Configuration object for the Sentrix client.
    
    Reads from environment variables by default, with explicit arguments
    taking priority.
    
    Environment Variables:
        SENTRIX_BASE_URL   - Server URL (default: http://localhost:8080)
        SENTRIX_API_KEY    - Agent API key
        SENTRIX_TIMEOUT    - Request timeout in seconds (default: 10)
        SENTRIX_MAX_RETRIES - Max retry attempts (default: 3)
        SENTRIX_VERIFY_SSL - SSL verification (default: true)
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        verify_ssl: Optional[bool] = None,
    ):
        self.base_url = (base_url or os.environ.get("SENTRIX_BASE_URL", "http://localhost:8080")).rstrip("/")
        self.api_key = api_key or os.environ.get("SENTRIX_API_KEY")
        self.timeout = timeout or int(os.environ.get("SENTRIX_TIMEOUT", "10"))
        self.max_retries = max_retries or int(os.environ.get("SENTRIX_MAX_RETRIES", "3"))
        _verify_env = os.environ.get("SENTRIX_VERIFY_SSL", "true").lower()
        self.verify_ssl = verify_ssl if verify_ssl is not None else (_verify_env in ("true", "1", "yes"))


# ─────────────────────────────────────────────────────────────────────────────
# Custom Exceptions
# ─────────────────────────────────────────────────────────────────────────────

class SentrixError(Exception):
    """Base exception for all Sentrix SDK errors."""
    pass

class AuthenticationError(SentrixError):
    """Raised when agent authentication fails after all retries."""
    pass

class AuthorizationError(SentrixError):
    """Raised when an authorization request fails unexpectedly."""
    pass

class ConnectionError(SentrixError):
    """Raised when the SDK cannot reach the Sentrix backend."""
    pass

class ConfigurationError(SentrixError):
    """Raised when the SDK is misconfigured (missing API key, invalid URL, etc.)."""
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Main Client
# ─────────────────────────────────────────────────────────────────────────────

class SentrixClient:
    """
    The main Sentrix SDK client for AI agent governance and security.
    
    Provides authentication, authorization, audit logging, and session
    management against a Sentrix backend server.
    
    Quick Start:
        from sentrix import SentrixClient
        
        client = SentrixClient("https://your-server.com", api_key="sx_live_...")
        client.authenticate()
        
        decision = client.authorize("READ", "/api/v1/users")
        if decision:
            # perform the action
            client.log_action("READ", "/api/v1/users", "SUCCESS")
        
        client.logout()
    
    Environment-Based Configuration:
        # Set SENTRIX_BASE_URL and SENTRIX_API_KEY env vars, then:
        client = SentrixClient()
        client.authenticate()
    
    Context Manager:
        with SentrixClient("https://server.com", api_key="key") as client:
            decision = client.authorize("WRITE", "/data")
    
    Args:
        base_url: URL of the Sentrix backend (default: reads SENTRIX_BASE_URL env var, 
                  or "http://localhost:8080")
        api_key: Agent API key (default: reads SENTRIX_API_KEY env var)
        timeout: Request timeout in seconds (default: 10)
        max_retries: Maximum retry attempts for network failures (default: 3)
        verify_ssl: Whether to verify SSL certificates (default: True)
        config: A SentrixConfig object (overrides individual args)
    """

    SDK_VERSION = "1.0.0"
    USER_AGENT = f"sentrix-sdk-python/{SDK_VERSION}"

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: int = 10,
        max_retries: int = 3,
        verify_ssl: bool = True,
        config: Optional[SentrixConfig] = None,
    ):
        if config:
            self._config = config
        else:
            self._config = SentrixConfig(
                base_url=base_url,
                api_key=api_key,
                timeout=timeout,
                max_retries=max_retries,
                verify_ssl=verify_ssl,
            )

        self.base_url = self._config.base_url
        self.api_key = self._config.api_key
        self.session_token: Optional[str] = None
        self.agent_id: Optional[str] = None
        self.session_id: Optional[str] = None

        # Internal HTTP session with connection pooling
        self._http = requests.Session()
        self._http.verify = self._config.verify_ssl
        self._http.headers.update({
            "User-Agent": self.USER_AGENT,
            "Content-Type": "application/json",
        })

        # Heartbeat thread
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._heartbeat_stop = threading.Event()

        # Stats
        self._stats = {
            "total_requests": 0,
            "auth_calls": 0,
            "authorize_calls": 0,
            "log_calls": 0,
            "errors": 0,
        }

    # ── Context Manager ──────────────────────────────────────────────────

    def __enter__(self) -> "SentrixClient":
        self.authenticate()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.stop_heartbeat()
        self.logout()

    # ── Core Methods ─────────────────────────────────────────────────────

    def authenticate(self, api_key: Optional[str] = None) -> bool:
        """
        Authenticates the agent against the Sentrix backend using its API key.
        
        Stores session token, agent ID, and session ID internally for
        subsequent authorize/log calls.
        
        Args:
            api_key: Override API key (uses constructor/env key if not provided)
            
        Returns:
            True if authentication succeeded
            
        Raises:
            ConfigurationError: If no API key is available
            AuthenticationError: If authentication fails after all retries
        """
        target_key = api_key or self.api_key
        if not target_key:
            raise ConfigurationError(
                "API key is required. Provide it via:\n"
                "  • SentrixClient(api_key='your-key')\n"
                "  • Environment variable SENTRIX_API_KEY\n"
                "  • client.authenticate(api_key='your-key')"
            )

        url = f"{self.base_url}/api/v1/agent/authenticate"
        headers = {"X-API-Key": target_key}

        for attempt in range(self._config.max_retries):
            try:
                self._stats["auth_calls"] += 1
                self._stats["total_requests"] += 1
                response = self._http.post(
                    url, headers=headers, json={}, timeout=self._config.timeout
                )

                if response.status_code == 200:
                    data = response.json()
                    self.session_token = data.get("sessionToken")
                    self.agent_id = data.get("agentId")
                    self.session_id = data.get("sessionId")

                    # Update session-level headers
                    self._http.headers.update({
                        "Authorization": f"Bearer {self.session_token}",
                        "X-Agent-Id": str(self.agent_id),
                        "X-Session-Id": str(self.session_id),
                    })
                    logger.info("Successfully authenticated Sentrix agent (id=%s)", self.agent_id)
                    return True
                elif response.status_code == 401:
                    raise AuthenticationError(f"Invalid API key: {response.text}")
                elif response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 2 ** attempt))
                    logger.warning("Rate limited. Retrying in %ds...", retry_after)
                    time.sleep(retry_after)
                    continue
                else:
                    logger.warning(
                        "Auth failed (attempt %d/%d): HTTP %d — %s",
                        attempt + 1, self._config.max_retries,
                        response.status_code, response.text
                    )
            except requests.exceptions.ConnectionError as e:
                self._stats["errors"] += 1
                logger.error("Cannot connect to Sentrix server at %s: %s", self.base_url, e)
            except requests.RequestException as e:
                self._stats["errors"] += 1
                logger.error("Network error during authentication: %s", e)

            if attempt < self._config.max_retries - 1:
                time.sleep(2 ** attempt)

        raise AuthenticationError(
            f"Authentication failed after {self._config.max_retries} attempts. "
            f"Verify your API key and server URL ({self.base_url})."
        )

    def authorize(
        self,
        action: str,
        resource: str,
        context: Optional[Dict[str, Any]] = None,
        *,
        auto_authenticate: bool = True,
    ) -> AuthorizationDecision:
        """
        Checks whether the agent is authorized to perform the given action.
        
        This is the core method for runtime access control. It evaluates
        the agent's policies, context conditions, and ML anomaly scores.
        
        Args:
            action: The action to authorize (e.g., "READ", "WRITE", "DELETE",
                    "db:execute_query", "api:call")
            resource: The resource path (e.g., "/api/v1/users", 
                      "postgres/customer_records")
            context: Optional context dict for policy evaluation. Common keys:
                     - ip: Source IP address
                     - environment: "production", "staging", etc.
                     - department: Requesting department
                     - time_of_day: "business_hours", "off_hours"
            auto_authenticate: If True, automatically authenticates when
                              no session exists (default: True)
        
        Returns:
            AuthorizationDecision — truthy if allowed, falsy if denied.
            Access .risk_score, .matched_policies, .decision_reason for details.
        
        Example:
            decision = client.authorize("WRITE", "/api/financial-data", 
                                        context={"environment": "production"})
            if decision:
                print(f"Allowed (risk: {decision.risk_score})")
            else:
                print(f"Denied: {decision.decision_reason}")
        """
        if not self.session_token:
            if auto_authenticate:
                self.authenticate()
            else:
                return AuthorizationDecision(allowed=False, response_data={
                    "reason": "No active session. Call authenticate() first."
                })

        url = f"{self.base_url}/api/v1/agent/authorize"
        payload = {
            "action": action,
            "resource": resource,
            "context": context or {},
        }

        for attempt in range(self._config.max_retries):
            try:
                self._stats["authorize_calls"] += 1
                self._stats["total_requests"] += 1
                response = self._http.post(url, json=payload, timeout=self._config.timeout)

                if response.status_code == 200:
                    data = response.json()
                    decision = data.get("decision", "DENY")
                    return AuthorizationDecision(
                        allowed=(decision in ("ALLOW", "ALLOWED")),
                        response_data=data,
                    )
                elif response.status_code == 401:
                    logger.info("Session expired. Re-authenticating...")
                    try:
                        self.authenticate()
                        # Retry after re-auth
                        response = self._http.post(url, json=payload, timeout=self._config.timeout)
                        if response.status_code == 200:
                            data = response.json()
                            decision = data.get("decision", "DENY")
                            return AuthorizationDecision(
                                allowed=(decision in ("ALLOW", "ALLOWED")),
                                response_data=data,
                            )
                    except AuthenticationError:
                        pass
                elif response.status_code == 429:
                    retry_after = int(response.headers.get("Retry-After", 2 ** attempt))
                    logger.warning("Rate limited during authorization. Retrying in %ds...", retry_after)
                    time.sleep(retry_after)
                    continue
            except requests.RequestException as e:
                self._stats["errors"] += 1
                logger.error("Network error during authorization: %s", e)

            if attempt < self._config.max_retries - 1:
                time.sleep(2 ** attempt)

        return AuthorizationDecision(allowed=False, response_data={
            "reason": "Authorization request failed after retries."
        })

    def log_action(
        self,
        action: str,
        resource: str,
        outcome: str,
        latency_ms: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Logs a behavioral/audit event to the Sentrix governance system.
        
        Events are stored in the immutable SHA-256 audit chain and used
        by the ML anomaly detection engine for behavioral profiling.
        
        Args:
            action: The action performed (e.g., "READ", "WRITE")
            resource: The resource acted upon
            outcome: Result — "SUCCESS", "FAILURE", "ERROR", or "DENIED"
            latency_ms: Action duration in milliseconds
            metadata: Optional extra metadata (user context, error details, etc.)
            
        Returns:
            True if the log was submitted successfully
        """
        if not self.session_token:
            try:
                self.authenticate()
            except (AuthenticationError, ConfigurationError):
                return False

        url = f"{self.base_url}/api/v1/agent/log"
        payload = {
            "action": action,
            "resource": resource,
            "outcome": outcome,
            "latencyMs": latency_ms,
            "metadata": metadata or {},
        }

        try:
            self._stats["log_calls"] += 1
            self._stats["total_requests"] += 1
            response = self._http.post(url, json=payload, timeout=self._config.timeout)
            return response.status_code == 200
        except requests.RequestException as e:
            self._stats["errors"] += 1
            logger.error("Failed to submit audit log: %s", e)
            return False

    def heartbeat(self) -> bool:
        """
        Sends a keep-alive heartbeat for the current agent session.
        
        Returns:
            True if the heartbeat was acknowledged
        """
        if not self.session_token:
            return False

        url = f"{self.base_url}/api/v1/agent/heartbeat"
        try:
            self._stats["total_requests"] += 1
            response = self._http.post(url, timeout=self._config.timeout)
            return response.status_code == 200
        except requests.RequestException as e:
            self._stats["errors"] += 1
            logger.error("Heartbeat failed: %s", e)
            return False

    def logout(self) -> bool:
        """
        Terminates the active session and clears all tokens.
        
        Returns:
            True if logout succeeded
        """
        if not self.session_token:
            return True

        url = f"{self.base_url}/api/v1/agent/logout"
        try:
            self._stats["total_requests"] += 1
            response = self._http.post(url, timeout=self._config.timeout)
            return response.status_code in (200, 204)
        except requests.RequestException:
            return False
        finally:
            self._clear_session()

    # ── Advanced Features ────────────────────────────────────────────────

    def start_heartbeat(self, interval_seconds: int = 30) -> None:
        """
        Starts an automatic background heartbeat thread.
        
        Keeps the agent session alive by sending periodic heartbeats
        in the background. Call stop_heartbeat() or use the context
        manager to clean up.
        
        Args:
            interval_seconds: Seconds between heartbeats (default: 30)
        """
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            logger.warning("Heartbeat thread is already running.")
            return

        self._heartbeat_stop.clear()

        def _heartbeat_loop():
            while not self._heartbeat_stop.is_set():
                self.heartbeat()
                self._heartbeat_stop.wait(timeout=interval_seconds)

        self._heartbeat_thread = threading.Thread(
            target=_heartbeat_loop, daemon=True, name="sentrix-heartbeat"
        )
        self._heartbeat_thread.start()
        logger.info("Background heartbeat started (every %ds)", interval_seconds)

    def stop_heartbeat(self) -> None:
        """Stops the automatic background heartbeat thread."""
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            self._heartbeat_stop.set()
            self._heartbeat_thread.join(timeout=5)
            logger.info("Background heartbeat stopped.")

    @contextmanager
    def session(self, api_key: Optional[str] = None):
        """
        Context manager for a complete authenticated session lifecycle.
        
        Authenticates on entry, starts heartbeat, and cleanly logs out on exit.
        
        Example:
            client = SentrixClient("https://server.com", api_key="key")
            with client.session():
                decision = client.authorize("READ", "/data")
        """
        self.authenticate(api_key=api_key)
        self.start_heartbeat()
        try:
            yield self
        finally:
            self.stop_heartbeat()
            self.logout()

    def protect(
        self,
        action: str,
        resource: str,
        context: Optional[Dict[str, Any]] = None,
        on_deny: Optional[Callable] = None,
    ) -> Callable:
        """
        Decorator that protects a function with Sentrix authorization.
        
        Before the decorated function executes, the SDK checks authorization.
        If denied, raises PermissionError (or calls on_deny callback).
        If allowed, logs the action outcome after execution.
        
        Args:
            action: The action to authorize
            resource: The resource being accessed
            context: Optional context dict
            on_deny: Optional callback when access is denied.
                     Receives (action, resource, decision) as args.
        
        Example:
            @client.protect("db:query", "/database/customers")
            def query_customers():
                return db.execute("SELECT * FROM customers")
            
            # Calling query_customers() will first check authorization
            result = query_customers()
        """
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                decision = self.authorize(action, resource, context)

                if not decision:
                    if on_deny:
                        return on_deny(action, resource, decision)
                    raise PermissionError(
                        f"Sentrix denied access: action='{action}', "
                        f"resource='{resource}', reason='{decision.decision_reason}'"
                    )

                start_time = time.time()
                outcome = "SUCCESS"
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    outcome = "ERROR"
                    raise
                finally:
                    elapsed_ms = int((time.time() - start_time) * 1000)
                    self.log_action(action, resource, outcome, latency_ms=elapsed_ms)

            return wrapper
        return decorator

    def check(self, action: str, resource: str, context: Optional[Dict[str, Any]] = None) -> bool:
        """
        Simple boolean authorization check — no exceptions, no frills.
        
        Convenience method that returns True/False directly.
        
        Args:
            action: The action to authorize
            resource: The resource path
            context: Optional context dict
            
        Returns:
            True if allowed, False if denied
        """
        return bool(self.authorize(action, resource, context))

    def get_stats(self) -> Dict[str, int]:
        """
        Returns SDK usage statistics for the current session.
        
        Returns:
            Dict with keys: total_requests, auth_calls, authorize_calls,
            log_calls, errors
        """
        return dict(self._stats)

    @property
    def is_authenticated(self) -> bool:
        """Returns True if the client has an active session token."""
        return self.session_token is not None

    # ── Private Helpers ──────────────────────────────────────────────────

    def _clear_session(self) -> None:
        """Clears all session data from the client."""
        self.session_token = None
        self.agent_id = None
        self.session_id = None
        self._http.headers.pop("Authorization", None)
        self._http.headers.pop("X-Agent-Id", None)
        self._http.headers.pop("X-Session-Id", None)
