# 🛡️ SENTRIX — GUIDING MANUAL

Welcome to the **Sentrix** Guiding Manual. This document provides step-by-step instructions on how to run, use, and manage all tools, features, and interfaces of the Sentrix application. 

Sentrix is an enterprise-grade **Runtime Identity & Access Management (IAM) and Behavioral Security platform for AI Agents**. It combines rule-based access policies with real-time machine learning anomaly detection to ensure autonomous agents behave within safe, defined boundaries.

---

## 📋 TABLE OF CONTENTS
1. [Prerequisites & System Setup](#1-prerequisites--system-setup)
2. [Starting & Running the Application](#2-starting--running-the-application)
3. [Machine Learning Pipeline & Model Training](#3-machine-learning-pipeline--model-training)
4. [Using the Web Interface (Step-by-Step)](#4-using-the-web-interface-step-by-step)
5. [Using the Sentrix SDKs](#5-using-the-sentrix-sdks)
6. [API Reference & Testing Endpoints](#6-api-reference--testing-endpoints)
7. [System Implementation Status & Roadmap](#7-system-implementation-status--roadmap)

---

## 1. PREREQUISITES & SYSTEM SETUP

Before running the application, ensure your environment has the following software installed:

*   **Java Development Kit (JDK) 21 LTS** (Eclipse Temurin recommended)
*   **Node.js 22 LTS** & npm
*   **Python 3.12** (installed locally at `d:\PROJECTS\Sentrix\python312`)
*   **Docker Desktop** (for running PostgreSQL and Redis services)
*   **Git**

### Environment Configuration
1. Locate the `.env.example` file in the root folder.
2. Copy it to `.env` in the root folder:
   ```powershell
   copy .env.example .env
   ```
3. Update the credentials in `.env`, especially:
   *   `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
   *   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, & `RAZORPAY_WEBHOOK_SECRET` (if configuring payments)

---

## 2. STARTING & RUNNING THE APPLICATION

Sentrix runs as a multi-service architecture. You can start it locally or using Docker.

### Step 1: Start PostgreSQL and Redis (Docker)
In the root directory, start the required databases using Docker Compose:
```powershell
docker compose -f docker-compose.dev.yml up -d postgres redis
```
*This starts PostgreSQL on port `5432` and Redis on port `6379`.*

### Step 2: Set Up and Start the ML Service
1. Open a PowerShell terminal and navigate to the `ml` directory:
   ```powershell
   cd d:\PROJECTS\Sentrix\ml
   ```
2. Activate the Python virtual environment and install the dependencies:
   ```powershell
   .venv\Scripts\pip install -r requirements.txt
   ```
3. Start the FastAPI uvicorn server:
   ```powershell
   .venv\Scripts\uvicorn.exe api.main:app --port 8000 --reload
   ```
   *The ML API will be accessible at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

### Step 3: Run database migrations and Start the Java Backend
1. Open a new terminal and navigate to the `backend` directory:
   ```powershell
   cd d:\PROJECTS\Sentrix\backend
   ```
2. Run the Gradle build and compile step:
   ```powershell
   .\gradlew.bat compileJava
   ```
3. Run the Spring Boot application:
   ```powershell
   .\gradlew.bat bootRun
   ```
   *The backend server will run on `http://localhost:8080`.*

### Step 4: Run the React Frontend
1. Open a new terminal and navigate to the `frontend` directory:
   ```powershell
   cd d:\PROJECTS\Sentrix\frontend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173`.*

---

## 3. MACHINE LEARNING PIPELINE & MODEL TRAINING

The Sentrix security model relies on an ensemble ML scorer. If you need to generate synthetic behavioral data and train/retrain the models (Isolation Forest & PyTorch LSTM Autoencoder):

1. Navigate to the `ml` folder:
   ```powershell
   cd d:\PROJECTS\Sentrix\ml
   ```
2. Run the automated training pipeline:
   ```powershell
   .venv\Scripts\python.exe training/train_pipeline.py
   ```
   *This script does the following:*
   *   Generates a synthetic training log dataset with normal and anomalous behavior profiles.
   *   Preprocesses and extracts 25 behavioral features.
   *   Trains the Isolation Forest model (anomaly classification) and saves `isolation_forest.joblib`.
   *   Trains the PyTorch LSTM Autoencoder (sequence sequence anomaly scoring) and saves `lstm_autoencoder.pt`.
   *   Saves the preprocessing scaler `scaler.joblib` and model metadata.
   *   Places all trained weights in `ml/models/saved/` for real-time inference by the uvicorn server.

---

## 4. USING THE WEB INTERFACE (STEP-BY-STEP)

The web dashboard is the command center of Sentrix. Here is a walkthrough of each page and how to use its tools.

### A. Landing Page (`/`)
*   **Purpose**: Public introduction page.
*   **How to use**: 
    *   View the core features, architectural details, and pricing plans.
    *   Click **Get Started** or **Login** in the top navigation bar to go to the dashboard portal.

### B. Register & Login (`/register`, `/login`)
*   **Purpose**: Administrator / Security Operator sign-up and authentication.
*   **How to use**: 
    1. Click **Sign Up** to create an organization profile and administrative account.
    2. Log in using your email and password.
    3. Authentication is secured via short-lived JWT tokens and secure HTTP-Only refresh cookies.

### C. Dashboard Page (`/dashboard`)
*   **Purpose**: Real-time overview of the organization's AI Agent security posture.
*   **Key Features**:
    *   **Metrics Cards**: View total active agents, active policies, security events in the last 24h, and current organization billing plan limits.
    *   **Agent Risk Distribution Chart**: Displays agents categorized by risk level (Low, Medium, High).
    *   **Security Events Timeline Chart**: Tracks allow/deny decisions over time.
    *   **Live Violation Feed**: Shows recent policy violations and blocked attempts.

### D. Agents Page (`/agents`)
*   **Purpose**: AI Agent lifecycle management.
*   **How to use**:
    *   **Create Agent**: Click **Create New Agent**. Give the agent a name (e.g., "CustomerSupportAgent") and choose its type:
        *   `AUTONOMOUS`: Full self-action.
        *   `SEMI_AUTONOMOUS`: Confirms critical actions.
        *   `SUPERVISED`: Action-by-action approval.
        *   `TOOL`: Simple API/tool invocation.
    *   **Copy API Key**: Upon creation, the plaintext API Key is displayed **ONCE**. Copy it immediately. Subsequent displays will show only the prefix (e.g., `sen_live_abcd...`).
    *   **View Risk Scores**: View each agent's ML-generated risk score.
    *   **Manage Status**: You can manually **Activate**, **Suspend**, or **Revoke** an agent's credentials.

### E. Policies Page (`/policies`)
*   **Purpose**: Access control rule definition.
*   **How to use**:
    *   **Create Policy**: Click **Create New Policy**. Specify name, description, priority (lower number = higher precedence), and enforcement mode (`ENFORCING`, `PERMISSIVE`, `DISABLED`).
    *   **Visual Rule Builder**: Add access rules:
        *   **Effect**: `ALLOW` or `DENY`.
        *   **Action**: Actions like `READ`, `WRITE`, `EXECUTE`, `DELETE`, or a wildcard `*`.
        *   **Resource**: Target resource identifier using glob expressions (e.g., `database:prod:customers`, `api:v1:payments:*`).
        *   **Conditions**: Contextual criteria like `IP Address matches 192.168.1.*`, `Time Range between 09:00-17:00`, or `Max Risk Score allowed < 0.80`.
    *   **Assign to Agents**: Link policies to specific agents. Keep in mind that **DENY rules override ALLOW rules**.

### F. Resources Page (`/resources`)
*   **Purpose**: Inventory of secure assets that agents can access.
*   **How to use**:
    *   **Register Resource**: Click **Add Resource**. Enter name, resource URI pattern, and set a sensitivity level (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED`, `CRITICAL`).
    *   The Policy Engine references these sensitivity levels to match policies requiring higher authentication/risk guarantees for critical assets.

### G. Real-time Monitor Page (`/monitor`)
*   **Purpose**: High-frequency, live security event log.
*   **How to use**:
    *   This page connects directly to the backend WebSocket server using STOMP.
    *   Watch authorization decisions (Allows and Denys) populate in real-time as agents perform actions.
    *   Click on any event card to view the complete JSON event context, raw risk scores, and the policy that allowed or denied the action.

### H. Audit Logs Page (`/audit`)
*   **Purpose**: Cryptographically verifiable compliance logs.
*   **How to use**:
    *   Search and filter authorization history by agent, decision, target resource, and date range.
    *   **Cryptographic Verification**: Every audit log contains a SHA-256 hash that chains into the previous audit record. Click **Verify Chain** to compute and check the entire database chain. A green badge indicates data integrity is 100% verified (tamper-proof).
    *   **Export**: Export audit history as CSV or JSON.

### I. Billing Page (`/billing`)
*   **Purpose**: Subscription and limit upgrades.
*   **How to use**:
    *   View current usage (e.g., 4 / 5 agents created, 12,000 / 500,000 monthly API calls).
    *   **Upgrade Plan**: Click **Upgrade to Pro** or **Upgrade to Enterprise**. This triggers the Razorpay checkout overlay. Complete the mock payment (using Razorpay test mode card credentials) to upgrade limits instantly.
    *   **Invoice History**: View and download receipts/invoices.

### J. Settings Page (`/settings`)
*   **Purpose**: Organization parameters.
*   **How to use**: Set organization wide defaults, view API endpoint URLs, and configure Webhook subscriptions for alert notifications.

---

## 5. USING THE SENTRIX SDKs

Agents authenticate and verify access permissions in real-time using Sentrix SDKs.

### A. Python SDK
#### Installation:
```powershell
pip install d:\PROJECTS\Sentrix\sdk\python
```
#### Usage Example:
```python
from sentrix_sdk import SentrixClient

# Initialize the client with the agent API key
client = SentrixClient(
    api_key="sen_live_yourAgentApiKeyHere",
    base_url="http://localhost:8080"
)

# Start a session
session = client.authenticate(scopes=["database:read", "api:write"])
print(f"Authenticated Session Token: {session.token}")

# Perform authorization check
decision = client.authorize(
    action="WRITE",
    resource="database:prod:customers",
    context={
        "ip_address": "192.168.1.15",
        "client_version": "v1.4.2"
    }
)

if decision.allowed:
    print(f"Action allowed! Risk Score: {decision.risk_score}")
    # Perform database write...
else:
    print(f"Blocked! Reason: {decision.reason}")
    
# End session
client.logout()
```

### B. JavaScript / Node.js SDK
#### Installation:
```bash
npm install d:/PROJECTS/Sentrix/sdk/javascript
```
#### Usage Example:
```javascript
const { SentrixClient } = require('sentrix-sdk');

const client = new SentrixClient({
  apiKey: 'sen_live_yourAgentApiKeyHere',
  baseUrl: 'http://localhost:8080'
});

async function run() {
  // Start session
  await client.authenticate({ scopes: ['database:read'] });

  // Authorize check
  const decision = await client.authorize({
    action: 'WRITE',
    resource: 'database:prod:customers',
    context: { ip_address: '192.168.1.15' }
  });

  if (decision.allowed) {
    console.log(`Allowed! Risk: ${decision.riskScore}`);
  } else {
    console.error(`Access Denied: ${decision.reason}`);
  }
}
run();
```

---

## 6. API REFERENCE & TESTING ENDPOINTS

You can interact directly with the backend API using tools like Postman, curl, or the built-in Swagger UI.

*   **Swagger Documentation**: Navigate to `http://localhost:8080/swagger-ui/index.html` to test API request payloads.

### Key Endpoint Routes:
*   `POST /api/v1/auth/register` - Create Admin Account.
*   `POST /api/v1/auth/login` - Obtain Access JWT.
*   `GET /api/v1/agents` - Get list of agents.
*   `POST /api/v1/agent/authorize` - SDK runtime authorization check. Requires Bearer Token.
*   `GET /api/v1/audit/logs` - Query the immutable log table.
*   `POST /api/v1/billing/create-subscription` - Initiates billing plan upgrades.

---

## 7. SYSTEM IMPLEMENTATION STATUS & ROADMAP

The Sentrix framework is structured across several sequential phases:

### ✅ Implemented Features:
1.  **Phase 0 (Initialization)**: Full Multi-Project configuration, Gradle build definitions, environment variable mappings, and Docker configurations.
2.  **Phase 1 (Database Core)**: Schema migrations, cryptographic integrity triggers, and relational mappings for standard IAM entities.
3.  **Phase 2 (Backend Security)**: Spring Security filter chains, JWT validation, rate limiting, and API key management.
4.  **Phase 3 (Policy Engine Core)**: Glob pattern evaluation, priority-sorted conflict resolution (deny overrides), and virtual-thread processing.
5.  **Phase 4 (Billing Engine)**: Razorpay SDK integration, subscription statuses, webhooks, and invoice templates.
6.  **Phase 5 (React 19 SPA)**: Front-end templates, routing rules, contexts, real-time WebSocket dashboard, charts, and billing overlay.

### 🏃 Upcoming / Future Work:
*   **Scheduled Recalculations**: Tune `BaselineRecalculationJob.java` to periodically review active agent behaviors and update ML benchmarks.
*   **Auto-Revocation**: Enforce policy engine actions when agent risk exceeds the critical threshold (e.g., auto-revoke sessions and set agent status to `SUSPENDED`).
*   **Audit Retention Jobs**: Fully integrate `AuditRetentionJob.java` to clean logs exceeding the plan retention periods (Free = 7 days, Pro = 90 days, Enterprise = 365 days).
*   **Production Deployment**: Finalize the production multi-stage docker configurations and Nginx SSL proxy rules.
