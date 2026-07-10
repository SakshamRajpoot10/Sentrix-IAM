"""
🛡️ Sentrix SDK — AI Agent Governance & Security

The official Python SDK for Sentrix, providing runtime IAM,
policy enforcement, and ML-powered anomaly detection for AI agents.

Quick Start:
    from sentrix import SentrixClient

    client = SentrixClient("https://your-server.com", api_key="your-key")
    client.authenticate()
    decision = client.authorize("READ", "/api/v1/users")
    
Context Manager:
    with SentrixClient("https://server.com", api_key="key") as client:
        decision = client.authorize("WRITE", "/data")

Environment Variables:
    SENTRIX_BASE_URL  - Server URL
    SENTRIX_API_KEY   - Agent API key

Decorator:
    @client.protect("db:query", "/database/customers")
    def query_customers():
        return db.execute("SELECT * FROM customers")
"""

__version__ = "1.0.0"

from .client import (
    SentrixClient,
    SentrixConfig,
    AuthorizationDecision,
    SentrixError,
    AuthenticationError,
    AuthorizationError,
    ConnectionError,
    ConfigurationError,
)

__all__ = [
    "SentrixClient",
    "SentrixConfig",
    "AuthorizationDecision",
    "SentrixError",
    "AuthenticationError",
    "AuthorizationError",
    "ConnectionError",
    "ConfigurationError",
    "__version__",
]
