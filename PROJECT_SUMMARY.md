# 🛡️ SENTRIX — PROJECT SUMMARY

This document provides a comprehensive overview of the **Sentrix** project, detailing its purpose, architectural patterns, page-by-page operational tasks, database schema design, and runtime security flows.

---

## 🎯 1. PROJECT AIM & PROBLEM STATEMENT

### The Problem
Traditional Identity & Access Management (IAM) systems (like OAuth, Okta, Active Directory) are designed for **human users**. They assume a human initiates requests, has a steady IP address, uses a standard browser, and operates in relatively predictable patterns. 

However, **AI Agents** operate differently:
1.  They are highly autonomous and can make hundreds of requests per second.
2.  They execute non-linear sequences of actions (e.g., calling tools, reading databases, sending API payloads).
3.  Their behavioral sequences can shift, introducing risks like prompt injection, model jailbreaking, or data exfiltration.

### The Solution: Sentrix
Sentrix is a **Runtime IAM and Anomaly Detection system built specifically for AI Agents**. It addresses AI agent security by enforcing dual-layer defense:
*   **Layer 1: Rule-Based Policies**: Static authorization rules with a "Deny-Overrides" conflict resolver, determining what resources (glob-matched) and actions an agent is permitted to perform under strict constraints.
*   **Layer 2: ML-Based Behavioral Monitoring**: Continuous feature extraction and evaluation of agent activity patterns using an ensemble of **Isolation Forest** (for individual action anomaly) and **PyTorch LSTM Autoencoder** (for sequential/time-series behavioral anomaly) models.

---

## 📐 2. ARCHITECTURAL TOPOLOGY

Sentrix utilizes a high-performance, decoupled microservice layout designed for low-latency (< 10ms policy decisions, < 100ms ML anomaly detection):

```
                                  ┌────────────────────────┐
                                  │   React 19 Frontend    │
                                  └───────────┬────────────┘
                                              │ (HTTPS / STOMP WebSockets)
                                              ▼
                                   ┌──────────────────────┐
                                   │   Nginx API Gateway  │
                                   └──────────┬───────────┘
                                              │
                   ┌──────────────────────────┴──────────────────────────┐
                   │                                                     │
                   ▼ (Port 8080)                                         ▼ (Port 8000)
    ┌──────────────────────────────┐                      ┌──────────────────────────────┐
    │  Spring Boot 3.3 Backend     │                      │      FastAPI ML Service      │
    │  - Java 21 Virtual Threads   │                      │  - Python 3.12               │
    │  - Spring Security 6         │                      │  - PyTorch LSTM Autoencoder  │
    │  - Policy Engine             │◄────────────────────►│  - Isolation Forest Model    │
    │  - WebSocket STOMP Hub       │      (HTTP / JSON)   │  - Training/Inference Engine │
    └──────────────┬───────────────┘                      └──────────────┬───────────────┘
                   │                                                     │
         ┌─────────┴─────────┐                                           │
         ▼                   ▼                                           ▼
┌─────────────────┐ ┌─────────────────┐                        ┌─────────────────┐
│  PostgreSQL 17  │ │    Redis 7.4    │                        │   Model Store   │
│  - Relational   │ │  - Rate Limits  │                        │  - joblib / pt  │
│  - Audit Chain  │ │  - Cache / TTL  │                        └─────────────────┘
│  - Org Schema   │ │  - Session DB   │
└─────────────────┘ └─────────────────┘
```

---

## 📂 3. DETAILED FILE & MODULE MAP

### A. Java Backend (`backend/`)
*   `com.sentrix.config`: System beans (Security, WebSocket STOMP, Redis, Caffeine caching, WebClient configuration, and Project Loom Async Virtual Threads).
*   `com.sentrix.security`: Request parsing filters, API Key decryption & hashing verification (using bcrypt), and Redis-backed IP rate-limit filters.
*   `com.sentrix.entity`: Database mappings for `AdminUser`, `Organization`, `Agent`, `Policy`, `Resource`, `AgentSession`, `AuditLog`, `BehavioralEvent`, `Subscription`, `Invoice`.
*   `com.sentrix.engine`: Core evaluation orchestrator (`PolicyEngine`), wildcard path validator (`GlobMatcher`), conditional expressions parser (`ConditionMatcher`), and the conflict resolver prioritizing `DENY` outcomes (`ConflictResolver`).
*   `com.sentrix.service`: Business logic for JWT/API key generation, Razorpay payment processing, SHA-256 cryptographic audit chaining, usage quota checks, and asynchronous email notifications.
*   `com.sentrix.controller`: REST APIs exposing data to the frontend React app and runtime authorization hooks called by AI Agent SDKs.
*   `com.sentrix.scheduler`: Automated jobs for background recalculation, session cleanups, and policy-driven log retention enforcement.

### B. Python ML Service (`ml/`)
*   `api/`: FastAPI controller mapping request payloads into features for real-time model scoring.
*   `data/`: Normal user profiles, synthetic anomalous patterns, and log generation scripts.
*   `features/`: Feature transformers converting logs into 25 normalized dimension tensors.
*   `models/`: PyTorch LSTM Autoencoder architecture and scikit-learn Isolation Forest wrappers.
*   `scoring/`: Ensemble scorer combining predictions into a unified risk rating.
*   `training/`: Pipelines for hyperparameter optimization and exporting joblib/PT models.

### C. React Frontend (`frontend/`)
*   `contexts/`: State synchronization for session credentials, notification alerts, WebSocket streams, and subscription tiers.
*   `pages/`: Visual interfaces for the system, charts, builders, and administrative tools.
*   `components/`: Glassmorphic, highly customized widgets utilizing Framer Motion and Recharts.

---

## 📊 4. DATABASE SCHEMA SUMMARY

The primary transactional storage is **PostgreSQL 17**. The schema is managed incrementally using **Flyway migrations**:

1.  **organizations**: Tracks company metadata, selected billing tiers, current quotas, and integration API credentials.
2.  **admin_users**: Administrative accounts linked to roles (`SUPER_ADMIN`, `ADMIN`, `AGENT_MANAGER`, `VIEWER`).
3.  **agents**: Registered AI agents containing Status (`ACTIVE`, `SUSPENDED`), agent type, individual risk metrics, and their base behavioral profiles.
4.  **resources**: System resource catalogs with registered URI templates and sensitivity classifications (`PUBLIC` to `CRITICAL`).
5.  **policies**: Global security rules specifying Priority, Effects (`ALLOW` / `DENY`), and conditions.
6.  **agent_policies**: Join table mapping policies to agents.
7.  **agent_sessions**: Active SDK execution sessions, session start/end times, and permissions bounds.
8.  **audit_logs**: Immutable authorization logging table. Includes `previous_hash` and `hash` columns forming a SHA-256 cryptographic chain.
9.  **behavioral_events**: Raw transaction records used by the ML pipeline to extract anomalies.
10. **subscriptions** & **payments**: Razorpay integration transactions.
11. **invoices**: Auto-generated payment receipts.

---

## 💻 5. WEB INTERFACE FUNCTIONAL DESCRIPTION

Each dashboard interface executes targeted tasks and interfaces with the backend to perform security evaluations:

| Page / Route | Core Objective | Backend Operations | UI & Chart Mechanics |
|---|---|---|---|
| **Landing** (`/`) | Product display & entry point. | Exposes public configurations. | Animated landing sections using Framer Motion, pricing tier selection tables. |
| **Register & Login** (`/register`, `/login`) | User onboarding and authentication. | Authenticates user, signs JWTs, stores Secure Refresh Cookie. | Responsive validation fields using Zod and React Hook Form. |
| **Dashboard** (`/dashboard`) | High-level operations overview. | Reads organization-wide agent counts, alert aggregates, and active policies. | Renders Recharts displays showing Agent Risk Levels and Security Events Timeline. |
| **Agents** (`/agents`) | Agent provisioning and control. | Generates secure API keys (cryptographic UUIDs hashed via bcrypt), changes agent statuses. | Displays table lists of agents. Plaintext API key shown **ONCE** inside a secure modal. |
| **Policies** (`/policies`) | Access control configuration. | Validates priority rankings, writes JSON-formatted rules and context conditions. | Visual Rule Builder allowing operators to select Effects, Actions, Resources, and Constraints. |
| **Resources** (`/resources`) | Secured asset management. | Registers resource paths and links them to sensitivity levels. | Clean entry forms for URI templates and dropdown selectors for sensitivity ratings. |
| **Monitor** (`/monitor`) | Real-time event auditing. | Broadcasts transaction logs to `/topic/events` via STOMP WebSockets. | Infinite scrolling list displaying incoming decisions and color-coded risk flags. |
| **Audit Logs** (`/audit`) | Verification and forensic auditing. | Executes database chain recalculation using `HashChainUtil` to verify integrity. | Data grids with filters. Displays cryptographic hashes. "Verify Integrity" button triggers verification. |
| **Billing** (`/billing`) | Subscription limits management. | Generates Razorpay subscriptions, verifies signature hashes, updates Organization limits. | Plan utilization progress bars, dynamic Razorpay checkout script callback hook. |
| **Settings** (`/settings`) | Organization setup. | Reads and writes organization settings and webhook URL subscriptions. | Forms for webhook URLs and security alerts threshold configuration. |

---

## ⚙️ 6. RUNTIME AUTHORIZATION & EVALUATION FLOW

When an AI Agent requests access to a resource, the system executes the following steps in sequence:

```
[Agent Action Initiated]
        │
        ▼
1. SDK Authentication Check
   - Hashed API key verified using bcrypt.
   - Access JWT generated or validated.
        │
        ▼
2. Rate-Limiting Check
   - Redis checks request rates against Organization limits.
   - Over-limit calls rejected (429 Too Many Requests).
        │
        ▼
3. Rule-Based Policy Matching
   - Fetch all policies assigned to the agent.
   - Sort by Priority index.
   - Match Action (e.g., WRITE) and Resource (using GlobMatcher).
   - Evaluate Context Conditions (IP ranges, time bounds).
        │
        ▼
4. Anomaly & Risk Evaluation (FastAPI Ensemble)
   - Fetch recent behavioral event sequences for the agent.
   - FastAPI parses logs and converts them to 25 feature dimensions.
   - Isolation Forest predicts if individual action is anomalous.
   - PyTorch LSTM Autoencoder evaluates sequence trajectory error.
   - Ensemble combines models into a unified Risk Score (0.00 to 1.00).
        │
        ▼
5. Conflict Resolution
   - If Risk Score exceeds auto-revoke threshold: Decision = DENY, Agent Status set to SUSPENDED.
   - Apply "Deny-Overrides": if any matched policy is DENY, final decision is DENIED.
        │
        ▼
6. Immutable Logging & Broadcasting
   - Save decision to database. SHA-256 is computed using the previous log's hash.
   - PostgreSQL trigger blocks updates/deletions on audit log table.
   - Broadcast event details via WebSockets to Dashboard.
        │
        ▼
[Decision returned to Agent: ALLOW / DENY]
```

---

## 🤖 7. MACHINE LEARNING ENGINE DETAILS

### Feature Engineering (25 Dimensions)
For any agent evaluation window, Sentrix extracts 25 distinct features from raw log streams:
*   **Volumetric Features**: Total calls, failed attempts, unique resources, unique actions.
*   **Time-based Features**: Average request latency, variance in request intervals.
*   **Contextual Features**: Number of unique IPs, count of high-sensitivity resources.
*   **Semantic Features**: Action-to-resource compatibility ratios, unexpected pattern transitions.

### Ensemble Scoring
1.  **Isolation Forest (`isolation_forest.joblib`)**: Fits multi-dimensional clustering boundaries. Isolates single event spikes (e.g., access to a restricted database path during non-work hours).
2.  **PyTorch LSTM Autoencoder (`lstm_autoencoder.pt`)**: Analyzes temporal behavior sequences. Predicts the reconstruction error of the last 20 actions. A high reconstruction error indicates a deviation in sequence logic (e.g., prompt injection leading to unexpected API calls).
3.  **Risk Scorer (`risk_scorer.py`)**: Computes:
    $$\text{Risk Score} = w_1 \cdot P_{\text{IsolationForest}} + w_2 \cdot P_{\text{LSTMAutoencoder}}$$
    Where $w_1 = 0.4$ and $w_2 = 0.6$. If the risk score exceeds `0.80` (configurable), the system triggers auto-revocation.
