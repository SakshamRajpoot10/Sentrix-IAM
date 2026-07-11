# Contributing to Sentrix

Thank you for your interest in contributing to Sentrix! This guide will help you get started.

## 📋 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## 🚀 Getting Started

### 1. Fork & Clone

```bash
git fork https://github.com/SakshamRajpoot10/Sentrix-IAM.git
git clone https://github.com/YOUR_USERNAME/Sentrix-IAM.git
cd Sentrix-IAM
```

### 2. Set Up Development Environment

Follow the [Quick Start guide](README.md#-quick-start) to set up PostgreSQL, Redis, and all services.

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 📁 Project Structure

```
Sentrix-IAM/
├── backend/          # Spring Boot API (Java 21)
│   ├── src/main/java/com/sentrix/
│   │   ├── config/       # Security, WebSocket, CORS config
│   │   ├── controller/   # REST API controllers
│   │   ├── entity/       # JPA entities
│   │   ├── service/      # Business logic
│   │   ├── security/     # JWT, rate limiting, filters
│   │   └── repository/   # Data access layer
│   └── src/main/resources/
│       └── db/migration/ # Flyway SQL migrations
├── frontend/         # React + Vite dashboard
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level page components
│       ├── services/     # API client services
│       └── context/      # React context providers
├── ml/               # Python ML service
│   ├── api/          # FastAPI routes and schemas
│   ├── features/     # Feature extraction pipeline
│   ├── models/       # Model architectures (LSTM, etc.)
│   ├── scoring/      # Risk scoring and baseline
│   └── training/     # Training pipeline
├── sdk/
│   └── python/       # Python SDK client library
└── docs/             # Documentation and images
```

## 🔧 Development Workflow

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add agent bulk import API
fix: correct rate limiter window calculation
docs: update API reference for v1.1
refactor: extract policy evaluation into service
test: add integration tests for ML baseline
chore: update Spring Boot to 3.3.3
```

### Code Style

- **Java:** Follow Google Java Style Guide
- **Python:** Follow PEP 8 with Black formatter
- **JavaScript/React:** Follow Airbnb JavaScript Style Guide
- **SQL:** Use uppercase keywords, lowercase identifiers

### Testing

```bash
# Backend tests
cd backend && ./gradlew test

# ML service tests
cd ml && python -m pytest

# Frontend tests
cd frontend && npm test

# Integration test
python sdk/python/tests/test_integration.py
```

## 🏷️ Pull Request Process

1. **Update documentation** if you've changed APIs or behavior
2. **Add tests** for new features
3. **Ensure all tests pass** before submitting
4. **Fill out the PR template** completely
5. **Request review** from maintainers

### PR Title Format

```
feat(backend): add agent bulk import endpoint
fix(ml): correct LSTM threshold bounds
docs: update deployment guide for GCP
```

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Java version, Python version)
- Relevant logs

## 💡 Feature Requests

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) and describe:
- The problem you're trying to solve
- Your proposed solution
- Alternative approaches considered

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
