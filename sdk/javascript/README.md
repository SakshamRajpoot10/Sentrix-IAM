# 🛡️ Sentrix SDK — JavaScript / Node.js

[![npm version](https://img.shields.io/npm/v/sentrix-sdk.svg)](https://www.npmjs.com/package/sentrix-sdk)
[![Node.js](https://img.shields.io/node/v/sentrix-sdk.svg)](https://www.npmjs.com/package/sentrix-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://github.com/sentrix-ai/sentrix/blob/main/LICENSE)

**The official JavaScript/Node.js SDK for [Sentrix](https://github.com/sentrix-ai/sentrix)** — Runtime IAM and Anomaly Detection for AI Agents.

Sentrix provides enterprise-grade governance for autonomous AI agents, including rule-based policy enforcement, ML-powered behavioral anomaly detection, and cryptographic audit logging.

---

## Installation

```bash
npm install sentrix-sdk
```

**Requirements:** Node.js 16+

---

## Quick Start

```javascript
const SentrixClient = require('sentrix-sdk');

// Initialize client with your Sentrix server URL and agent API key
const client = new SentrixClient(
  'https://your-sentrix-server.com',
  'your-agent-api-key'
);

async function main() {
  // Authenticate the agent
  await client.authenticate();

  // Check if the agent is authorized to perform an action
  const decision = await client.authorize(
    'READ',
    '/api/v1/users',
    { ip: '192.168.1.10', environment: 'production' }
  );

  if (decision.allowed) {
    console.log('✅ Access granted');
    
    // Log the action for audit trail
    await client.logAction('READ', '/api/v1/users', 'SUCCESS', 45);
  } else {
    console.log('🚫 Access denied');
    console.log('   Reason:', decision.responseData);
  }

  // Clean up when done
  await client.logout();
}

main().catch(console.error);
```

### TypeScript Usage

This package ships with built-in TypeScript type declarations:

```typescript
import SentrixClient, { AuthorizationDecision } from 'sentrix-sdk';

const client = new SentrixClient('https://your-server.com', 'your-key');
await client.authenticate();

const decision: AuthorizationDecision = await client.authorize('WRITE', '/data');
console.log(decision.allowed); // boolean
```

---

## API Reference

### `new SentrixClient(baseUrl?, apiKey?)`

Creates a new Sentrix client instance.

| Parameter  | Type     | Default                  | Description                         |
|------------|----------|--------------------------|-------------------------------------|
| `baseUrl`  | `string` | `"http://localhost:8080"` | URL of your Sentrix backend server  |
| `apiKey`   | `string` | `null`                   | Agent API key for authentication    |

---

### `client.authenticate(apiKey?) → Promise<boolean>`

Authenticates the agent against the Sentrix backend. Stores session token, agent ID, and session ID internally.

- **Returns:** `true` if authentication succeeded, `false` otherwise.
- **Retries:** Automatically retries up to 3 times with exponential backoff.

```javascript
const success = await client.authenticate();
if (!success) {
  console.log('Authentication failed');
}
```

---

### `client.authorize(action, resource, context?) → Promise<AuthorizationDecision>`

Checks whether the agent is authorized to perform the given action on the specified resource.

| Parameter  | Type     | Description                                       |
|------------|----------|---------------------------------------------------|
| `action`   | `string` | The action to authorize (e.g., `"READ"`, `"WRITE"`, `"DELETE"`) |
| `resource` | `string` | The resource path (e.g., `"/api/v1/users"`)       |
| `context`  | `object` | Optional context (IP, time, environment, etc.)    |

- **Returns:** `AuthorizationDecision` with `.allowed` boolean and `.responseData`.
- **Auto-authenticates** if no active session exists.
- **Auto-refreshes** expired sessions.

```javascript
const decision = await client.authorize('WRITE', '/database/customers');

if (decision.allowed) {
  console.log('Allowed!');
} else {
  console.log('Denied:', decision.responseData);
}
```

---

### `client.logAction(action, resource, outcome, latencyMs?, metadata?) → Promise<boolean>`

Logs a behavioral/audit event to the Sentrix governance system.

| Parameter    | Type     | Description                                      |
|--------------|----------|--------------------------------------------------|
| `action`     | `string` | The action performed                             |
| `resource`   | `string` | The resource acted upon                          |
| `outcome`    | `string` | Result (e.g., `"SUCCESS"`, `"FAILURE"`, `"ERROR"`) |
| `latencyMs`  | `number` | Action duration in milliseconds (default: `0`)   |
| `metadata`   | `object` | Optional additional metadata                     |

```javascript
await client.logAction('READ', '/api/data', 'SUCCESS', 23);
```

---

### `client.heartbeat() → Promise<boolean>`

Sends a keep-alive heartbeat for the current agent session.

```javascript
await client.heartbeat();
```

---

### `client.logout() → Promise<boolean>`

Terminates the active session and clears all tokens.

```javascript
await client.logout();
```

---

### `AuthorizationDecision`

Returned by `client.authorize()`.

| Property        | Type     | Description                               |
|-----------------|----------|-------------------------------------------|
| `allowed`       | `boolean` | Whether the action is permitted          |
| `responseData`  | `object`  | Full response from the authorization API |

---

## Advanced Usage

### Context-Aware Authorization

Pass rich context for policy evaluation with IP ranges, time bounds, and custom attributes:

```javascript
const decision = await client.authorize(
  'WRITE',
  '/api/v1/financial-data',
  {
    ip: '10.0.0.50',
    environment: 'production',
    department: 'finance',
    timeOfDay: 'business_hours'
  }
);
```

### Session Keep-Alive

For long-running agents, periodically send heartbeats:

```javascript
setInterval(async () => {
  await client.heartbeat();
}, 30000); // Every 30 seconds
```

---

## What is Sentrix?

Sentrix is a **Runtime IAM and Anomaly Detection system built specifically for AI Agents**. It provides:

- 🛡️ **Rule-Based Policy Engine** — Deny-overrides conflict resolution, glob-matched resources, conditional expressions
- 🤖 **ML-Based Behavioral Monitoring** — Isolation Forest + LSTM Autoencoder ensemble for real-time anomaly detection
- 🔗 **Cryptographic Audit Chain** — SHA-256 chained, immutable audit logs
- ⚡ **Low Latency** — <10ms policy decisions, <100ms ML scoring

Learn more at [github.com/sentrix-ai/sentrix](https://github.com/sentrix-ai/sentrix).

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.
