# Changelog

All notable changes to Sentrix will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-11

### Added
- **Core IAM Platform**
  - Agent registration, authentication, and lifecycle management
  - SHA-256 hashed API key authentication with prefix-based lookup
  - JWT-based session management with access/refresh tokens
  - Organization multi-tenancy with role-based admin access

- **Policy Engine**
  - Granular ALLOW/DENY policies with resource pattern matching
  - Priority-based evaluation with DENY-takes-precedence
  - Policy versioning with automatic version incrementing
  - ENFORCING, PERMISSIVE, and DISABLED enforcement modes

- **AI-Powered Anomaly Detection**
  - LSTM Autoencoder for sequence-based behavioral anomaly detection
  - Isolation Forest for unsupervised feature-space anomaly detection
  - Combined risk scoring with configurable weights (60% IF, 40% LSTM)
  - Dynamic per-agent LSTM thresholds calibrated from behavioral baselines
  - Automatic agent suspension on critical risk (≥ 0.80)

- **Adaptive Rate Limiting**
  - Redis-backed sliding window rate limiting
  - Risk-aware dynamic throttling (limits scale down as risk increases)
  - Per-agent configurable base rate (maxActionsPerMinute)
  - Formula: `limit = max(1, maxActions × (1.0 - riskScore × 0.8))`

- **Real-Time Dashboard**
  - WebSocket-powered live security console
  - Agent activity monitoring with status indicators
  - Risk visualization with time-series charts
  - Policy management interface with assignment workflows

- **Billing & Subscriptions**
  - Razorpay payment integration
  - Tiered plans: Free, Professional ($49/mo), Enterprise ($199/mo)
  - Usage metering against plan quotas
  - Invoice generation and history

- **Python SDK**
  - `SentrixClient` class with `authenticate()` and `authorize()` methods
  - Session management with automatic token refresh
  - Full type hints and documentation

- **Documentation**
  - Comprehensive README with architecture diagrams
  - API reference with all endpoints documented
  - Security policy and contributing guide
  - Quick start and deployment guides

### Security
- All API keys hashed with SHA-256 before storage
- JWT tokens with HMAC-SHA256 signing
- CORS configured with explicit origin whitelist
- Rate limiting with Redis-backed sliding windows
- Automatic session revocation on agent suspension
- ML service isolated with internal API key authentication
