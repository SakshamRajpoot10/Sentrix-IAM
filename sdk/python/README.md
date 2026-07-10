# 🛡️ Sentrix SDK — Python

[![PyPI version](https://img.shields.io/pypi/v/sentrix-sdk.svg)](https://pypi.org/project/sentrix-sdk/)
[![Python](https://img.shields.io/pypi/pyversions/sentrix-sdk.svg)](https://pypi.org/project/sentrix-sdk/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/sentrix-ai/sentrix/blob/main/LICENSE)

**The official Python SDK for [Sentrix](https://github.com/sentrix-ai/sentrix)** — Runtime IAM and Anomaly Detection for AI Agents.

Sentrix provides enterprise-grade governance for autonomous AI agents, including rule-based policy enforcement, ML-powered behavioral anomaly detection, and cryptographic audit logging. This SDK gives your Python agents a direct connection to the Sentrix security platform.

---

## Installation

```bash
pip install sentrix-sdk
```

**Requirements:** Python 3.8+  |  Only dependency: `requests`

---

## Quick Start

```python
from sentrix import SentrixClient

# Initialize and authenticate
client = SentrixClient(
    base_url="https://your-sentrix-server.com",
    api_key="sx_live_8192abcdef..."
)
client.authenticate()

# Check authorization before performing actions
decision = client.authorize("READ", "/api/v1/users")

if decision:
    print(f"✅ Access granted (risk score: {decision.risk_score})")
    # Perform the action, then log it
    client.log_action("READ", "/api/v1/users", "SUCCESS", latency_ms=45)
else:
    print(f"🚫 Access denied — {decision.decision_reason}")

client.logout()
```

---

## Features at a Glance

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | API key auth with automatic retry and exponential backoff |
| 🛡️ **Authorization** | Policy + ML anomaly-aware access control decisions |
| 📝 **Audit Logging** | Immutable SHA-256 chained action logging |
| 💓 **Auto Heartbeat** | Background thread keeps sessions alive |
| 🎯 **`@protect` Decorator** | One-line function-level access control |
| 🔄 **Context Manager** | `with` statement for clean session lifecycle |
| ⚙️ **Env Var Config** | Zero-code configuration via environment variables |
| 🔁 **Smart Retries** | Exponential backoff with rate-limit awareness |
| 📊 **Usage Stats** | Built-in request/error tracking |
| 🏷️ **Typed** | Full type annotations, PEP 561 `py.typed` marker |

---

## Configuration

### Option 1: Direct Arguments

```python
client = SentrixClient(
    base_url="https://sentrix.example.com",
    api_key="sx_live_8192abcdef...",
    timeout=15,          # Request timeout (seconds)
    max_retries=3,       # Retry attempts on failure
    verify_ssl=True,     # SSL certificate verification
)
```

### Option 2: Environment Variables (Recommended for Production)

```bash
export SENTRIX_BASE_URL="https://sentrix.example.com"
export SENTRIX_API_KEY="sx_live_8192abcdef..."
export SENTRIX_TIMEOUT=15
export SENTRIX_MAX_RETRIES=3
export SENTRIX_VERIFY_SSL=true
```

```python
# No arguments needed — reads from env vars automatically
client = SentrixClient()
client.authenticate()
```

### Option 3: Config Object

```python
from sentrix import SentrixClient, SentrixConfig

config = SentrixConfig(
    base_url="https://sentrix.example.com",
    api_key="sx_live_8192abcdef...",
)
client = SentrixClient(config=config)
```

---

## API Reference

### `SentrixClient`

#### Constructor

```python
client = SentrixClient(
    base_url="http://localhost:8080",  # Sentrix server URL
    api_key=None,                      # Agent API key
    timeout=10,                        # Request timeout (seconds)
    max_retries=3,                     # Retry attempts
    verify_ssl=True,                   # SSL verification
    config=None,                       # SentrixConfig object (overrides above)
)
```

---

#### `client.authenticate(api_key=None) → bool`

Authenticates the agent and establishes a session.

```python
client.authenticate()
# or with an explicit key
client.authenticate(api_key="sx_live_override_key")
```

**Raises:** `AuthenticationError`, `ConfigurationError`

---

#### `client.authorize(action, resource, context=None) → AuthorizationDecision`

Core method — checks if the agent is authorized to perform an action.

```python
decision = client.authorize(
    action="WRITE",
    resource="/api/v1/financial-data",
    context={
        "ip": "10.0.0.50",
        "environment": "production",
        "department": "finance",
    }
)

print(decision.allowed)          # bool
print(decision.risk_score)       # float (0.0 – 1.0)
print(decision.matched_policies) # list of policy names
print(decision.decision_reason)  # human-readable reason
```

---

#### `client.log_action(action, resource, outcome, latency_ms=0, metadata=None) → bool`

Logs an action to the immutable audit chain.

```python
client.log_action(
    action="db:execute_query",
    resource="postgres/customers",
    outcome="SUCCESS",
    latency_ms=23,
    metadata={"query_type": "SELECT", "rows_returned": 150}
)
```

---

#### `client.heartbeat() → bool`

Sends a session keep-alive signal.

---

#### `client.logout() → bool`

Terminates the session and clears tokens.

---

### Context Manager

Automatically authenticates, maintains heartbeat, and logs out:

```python
with SentrixClient("https://server.com", api_key="key") as client:
    decision = client.authorize("READ", "/data")
```

Or using the `.session()` context manager:

```python
client = SentrixClient("https://server.com", api_key="key")
with client.session():
    decision = client.authorize("READ", "/data")
    # heartbeat runs in background
# auto-logout on exit
```

---

### `@client.protect()` Decorator

Protect any function with authorization — the simplest integration pattern:

```python
@client.protect("db:query", "/database/customers")
def get_customer_data():
    return db.execute("SELECT * FROM customers")

# Authorization is checked BEFORE the function runs.
# The action is logged AFTER execution.
result = get_customer_data()  # Raises PermissionError if denied
```

With a custom deny handler:

```python
def handle_deny(action, resource, decision):
    logger.warning(f"Blocked: {action} on {resource}")
    return {"error": "Access denied"}

@client.protect("api:call", "/external/payment-api", on_deny=handle_deny)
def process_payment(amount):
    return payment_gateway.charge(amount)
```

---

### Auto Heartbeat

Keep long-running agent sessions alive:

```python
client.authenticate()
client.start_heartbeat(interval_seconds=30)  # Background thread

# ... agent runs for hours ...

client.stop_heartbeat()
client.logout()
```

---

### Usage Statistics

```python
stats = client.get_stats()
# {
#     "total_requests": 142,
#     "auth_calls": 2,
#     "authorize_calls": 89,
#     "log_calls": 48,
#     "errors": 3
# }
```

---

### Properties

```python
client.is_authenticated  # bool — True if session is active
```

---

## Exception Hierarchy

```
SentrixError (base)
├── AuthenticationError    # Auth failures
├── AuthorizationError     # Authorization request errors
├── ConnectionError        # Cannot reach Sentrix server
└── ConfigurationError     # Missing API key, bad URL, etc.
```

```python
from sentrix import SentrixClient, AuthenticationError, ConfigurationError

try:
    client = SentrixClient()
    client.authenticate()
except ConfigurationError:
    print("Missing SENTRIX_API_KEY environment variable")
except AuthenticationError:
    print("Invalid API key or server rejected authentication")
```

---

## Framework Integration Examples

### LangChain Agent

```python
from sentrix import SentrixClient

sentrix = SentrixClient(api_key="sx_live_...")
sentrix.authenticate()

@sentrix.protect("tool:execute", "/tools/search-web")
def search_web(query: str):
    return search_api.search(query)

# Use in LangChain tool
from langchain.tools import Tool
tool = Tool(name="search", func=search_web, description="Search the web")
```

### FastAPI Middleware

```python
from fastapi import FastAPI, Request, HTTPException
from sentrix import SentrixClient

app = FastAPI()
sentrix = SentrixClient(api_key="sx_live_...")
sentrix.authenticate()

@app.middleware("http")
async def sentrix_guard(request: Request, call_next):
    decision = sentrix.authorize(
        action=request.method,
        resource=request.url.path,
        context={"ip": request.client.host}
    )
    if not decision:
        raise HTTPException(status_code=403, detail="Denied by Sentrix policy")
    return await call_next(request)
```

### Flask Guard

```python
from flask import Flask, request, abort
from sentrix import SentrixClient

app = Flask(__name__)
sentrix = SentrixClient(api_key="sx_live_...")
sentrix.authenticate()

@app.before_request
def sentrix_guard():
    decision = sentrix.authorize(
        action=request.method,
        resource=request.path,
        context={"ip": request.remote_addr}
    )
    if not decision:
        abort(403, f"Denied by Sentrix: {decision.decision_reason}")
```

---

## What is Sentrix?

Sentrix is a **Runtime IAM and Anomaly Detection system built specifically for AI Agents**:

- 🛡️ **Rule-Based Policy Engine** — Deny-overrides conflict resolution, glob-matched resources
- 🤖 **ML Behavioral Monitoring** — Isolation Forest + LSTM Autoencoder ensemble
- 🔗 **Cryptographic Audit Chain** — SHA-256 chained, immutable audit logs
- ⚡ **Low Latency** — <10ms policy decisions, <100ms ML scoring
- 📊 **Real-Time Dashboard** — WebSocket-powered live monitoring

Learn more at [github.com/sentrix-ai/sentrix](https://github.com/sentrix-ai/sentrix).

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.
