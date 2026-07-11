# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | ✅ Active support  |
| < 1.0   | ❌ No longer supported |

## Reporting a Vulnerability

**⚠️ Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in Sentrix, please report it responsibly:

1. **Email:** Send a detailed report to [sakshamrajpoot094@gmail.com](mailto:sakshamrajpoot094@gmail.com)
2. **Subject:** Use the format: `[SECURITY] Brief description of vulnerability`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | Within 48 hours |
| Initial Assessment | Within 5 business days |
| Fix Development | Within 14 business days |
| Public Disclosure | After fix is deployed |

## Security Architecture

Sentrix is built with security-first principles:

### Authentication
- **Admin Users:** Email/password with bcrypt hashing + JWT tokens (15-min access, 7-day refresh)
- **AI Agents:** SHA-256 hashed API keys with prefix-based lookup + session tokens
- **ML Service:** Internal API key authentication between backend and ML service

### Authorization
- **Policy Engine:** Priority-based RBAC/ABAC with DENY-takes-precedence evaluation
- **Rate Limiting:** Adaptive, risk-aware rate limiting with Redis-backed sliding windows
- **Auto-Suspension:** Agents exceeding risk threshold (≥0.80) are automatically suspended

### Data Protection
- **Encryption in Transit:** TLS 1.3 for all API communications
- **Encryption at Rest:** PostgreSQL with encrypted storage
- **Secret Management:** Environment variables and Google Cloud Secret Manager
- **Audit Logging:** Immutable audit trail of all security-relevant events

### ML Security
- **Model Isolation:** ML service runs in separate container with internal-only access
- **Input Validation:** All ML inputs are validated and sanitized
- **Threshold Bounds:** Dynamic LSTM thresholds are bounded within [0.01, 0.20] to prevent manipulation

## Dependencies

We regularly audit dependencies for known vulnerabilities using:
- **Gradle Dependency Check** for Java dependencies
- **pip-audit** for Python dependencies
- **npm audit** for frontend dependencies

## Responsible Disclosure

We believe in responsible disclosure. We will:
- Work with you to understand and validate the issue
- Develop and test a fix
- Credit you in our security advisories (unless you prefer anonymity)
- Not take legal action against good-faith security researchers
