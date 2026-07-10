-- ═══════════════════════════════════════════════════════════════
-- SENTRIX — V1: Initial Database Schema
-- PostgreSQL 17
-- ═══════════════════════════════════════════════════════════════

-- ─── Organizations ──────────────────────────────────────────
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    plan            VARCHAR(50) NOT NULL DEFAULT 'FREE',
    agent_limit     INTEGER NOT NULL DEFAULT 5,
    policy_limit    INTEGER NOT NULL DEFAULT 10,
    api_call_limit  INTEGER NOT NULL DEFAULT 10000,
    audit_retention_days INTEGER NOT NULL DEFAULT 7,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ─── Admin Users ────────────────────────────────────────────
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_org ON admin_users(organization_id);

-- ─── Refresh Tokens ─────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id   UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(admin_user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ─── Agents ─────────────────────────────────────────────────
CREATE TABLE agents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    type                VARCHAR(50) NOT NULL DEFAULT 'AUTONOMOUS',
    status              VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    api_key_hash        VARCHAR(255) NOT NULL,
    api_key_prefix      VARCHAR(20) NOT NULL,
    risk_score          DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    trust_level         INTEGER NOT NULL DEFAULT 100,
    max_actions_per_minute INTEGER DEFAULT 60,
    allowed_ip_ranges   JSONB DEFAULT '[]'::jsonb,
    behavioral_baseline JSONB DEFAULT '{}'::jsonb,
    metadata            JSONB DEFAULT '{}'::jsonb,
    last_active_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_prefix ON agents(api_key_prefix);
CREATE UNIQUE INDEX idx_agents_api_key_hash ON agents(api_key_hash);

-- ─── Policies ───────────────────────────────────────────────
CREATE TABLE policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    effect          VARCHAR(20) NOT NULL DEFAULT 'ALLOW',
    enforcement     VARCHAR(20) NOT NULL DEFAULT 'ENFORCING',
    priority        INTEGER NOT NULL DEFAULT 100,
    rules           JSONB NOT NULL DEFAULT '[]'::jsonb,
    conditions      JSONB DEFAULT '{}'::jsonb,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    version         INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_org ON policies(organization_id);
CREATE INDEX idx_policies_effect ON policies(effect);
CREATE INDEX idx_policies_enforcement ON policies(enforcement);

-- ─── Agent-Policy Assignment (Many-to-Many) ─────────────────
CREATE TABLE agent_policies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    policy_id   UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES admin_users(id),
    UNIQUE(agent_id, policy_id)
);

CREATE INDEX idx_agent_policies_agent ON agent_policies(agent_id);
CREATE INDEX idx_agent_policies_policy ON agent_policies(policy_id);

-- ─── Resources ──────────────────────────────────────────────
CREATE TABLE resources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    resource_type   VARCHAR(100) NOT NULL,
    identifier      VARCHAR(500) NOT NULL,
    sensitivity     VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
    description     TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_org ON resources(organization_id);
CREATE INDEX idx_resources_identifier ON resources(identifier);
CREATE INDEX idx_resources_sensitivity ON resources(sensitivity);

-- ─── Agent Sessions ─────────────────────────────────────────
CREATE TABLE agent_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    scopes      JSONB DEFAULT '["*"]'::jsonb,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at  TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_agent ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_token ON agent_sessions(token_hash);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);

-- ─── Audit Logs (Immutable — protected by triggers) ─────────
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    agent_id        UUID REFERENCES agents(id),
    session_id      UUID REFERENCES agent_sessions(id),
    action          VARCHAR(255) NOT NULL,
    resource        VARCHAR(500),
    decision        VARCHAR(20) NOT NULL,
    risk_score      DOUBLE PRECISION,
    policy_id       UUID REFERENCES policies(id),
    reason          TEXT,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    request_context JSONB DEFAULT '{}'::jsonb,
    hash            VARCHAR(64) NOT NULL,
    previous_hash   VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_agent ON audit_logs(agent_id);
CREATE INDEX idx_audit_logs_decision ON audit_logs(decision);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_hash ON audit_logs(hash);

-- ─── Behavioral Events ─────────────────────────────────────
CREATE TABLE behavioral_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    event_type      VARCHAR(100) NOT NULL,
    action          VARCHAR(255) NOT NULL,
    resource        VARCHAR(500),
    outcome         VARCHAR(50),
    latency_ms      INTEGER,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_behavioral_events_agent ON behavioral_events(agent_id);
CREATE INDEX idx_behavioral_events_created ON behavioral_events(created_at DESC);
CREATE INDEX idx_behavioral_events_agent_time ON behavioral_events(agent_id, created_at DESC);

-- ─── Subscriptions ──────────────────────────────────────────
CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    razorpay_plan_id    VARCHAR(255),
    plan                VARCHAR(50) NOT NULL DEFAULT 'FREE',
    status              VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    current_period_start TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_razorpay ON subscriptions(razorpay_subscription_id);

-- ─── Payments ───────────────────────────────────────────────
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES subscriptions(id),
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id   VARCHAR(255),
    razorpay_signature  VARCHAR(255),
    amount              BIGINT NOT NULL,
    currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    method              VARCHAR(50),
    description         TEXT,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_razorpay ON payments(razorpay_payment_id);

-- ─── Invoices ───────────────────────────────────────────────
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_id      UUID REFERENCES payments(id),
    invoice_number  VARCHAR(50) NOT NULL UNIQUE,
    amount          BIGINT NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    plan            VARCHAR(50) NOT NULL,
    billing_period_start TIMESTAMPTZ,
    billing_period_end   TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ,
    due_date        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ─── Usage Records ──────────────────────────────────────────
CREATE TABLE usage_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    record_date     DATE NOT NULL,
    api_calls       BIGINT NOT NULL DEFAULT 0,
    agents_active   INTEGER NOT NULL DEFAULT 0,
    policies_count  INTEGER NOT NULL DEFAULT 0,
    anomalies_detected INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, record_date)
);

CREATE INDEX idx_usage_records_org_date ON usage_records(organization_id, record_date DESC);

-- ─── Webhook Events (Idempotency) ──────────────────────────
CREATE TABLE webhook_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        VARCHAR(255) NOT NULL UNIQUE,
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    processed       BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at    TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- ─── System Settings ────────────────────────────────────────
CREATE TABLE system_settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
